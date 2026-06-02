'use server'

import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { createServiceClient } from '@/lib/supabase/server'
import { RegistreSchema } from './schema'
import { enviarEmail } from '@/lib/email'

function calcularEdat(isoDate: string): number {
  const avui = new Date()
  const naix = new Date(isoDate)
  let edat = avui.getFullYear() - naix.getFullYear()
  const m = avui.getMonth() - naix.getMonth()
  if (m < 0 || (m === 0 && avui.getDate() < naix.getDate())) edat--
  return edat
}

export type RegistreState =
  | {
      errors?: Record<string, string[]>
      error?: string
      /** Valors enviats — per repoblar el formulari en cas d'error */
      values?: Record<string, string>
      timestamp?: number
    }
  | undefined

function extractValues(formData: FormData, exclude: string[] = []): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of formData.entries()) {
    if (!exclude.includes(k) && typeof v === 'string') out[k] = v
  }
  return out
}

export async function registreAction(
  _prevState: RegistreState,
  formData: FormData
): Promise<RegistreState> {
  try {
    return await _registreAction(formData)
  } catch (err: unknown) {
    if (isRedirectError(err)) throw err
    console.error('[registreAction] error no controlat:', err)
    return {
      error: 'S\'ha produït un error inesperat. Torna-ho a intentar.',
      timestamp: Date.now(),
    }
  }
}

async function _registreAction(formData: FormData): Promise<RegistreState> {
  // 1. Validar dades del formulari
  const raw = Object.fromEntries(formData.entries())
  const parsed = RegistreSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      values: extractValues(formData, ['password', 'password_confirm']),
      timestamp: Date.now(),
    }
  }

  const data = parsed.data
  const supabase = await createServiceClient()

  // 2. Comprovar que el DNI no estigui duplicat
  const dniUpper = data.dni.toUpperCase()
  const [{ count: dniSoci }, { count: dniJugador }] = await Promise.all([
    supabase.from('socis').select('id', { count: 'exact', head: true }).eq('dni', dniUpper),
    supabase.from('jugadors').select('id', { count: 'exact', head: true }).eq('dni', dniUpper),
  ])
  if ((dniSoci ?? 0) > 0 || (dniJugador ?? 0) > 0) {
    return {
      errors: { dni: ['Aquest DNI/NIE ja està registrat al sistema.'] },
      values: extractValues(formData, ['password', 'password_confirm']),
      timestamp: Date.now(),
    }
  }

  // 3. Crear usuari a Supabase Auth (service role → no requereix confirmació)
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true, // Auto-confirmat, el club gestiona accés manualment
    })

  if (authError) {
    const values = extractValues(formData, ['password', 'password_confirm'])
    if (authError.message.toLowerCase().includes('already registered')) {
      return { errors: { email: ['Aquest correu ja està registrat.'] }, values, timestamp: Date.now() }
    }
    return { error: 'No s\'ha pogut crear el compte. Torna-ho a intentar.', values, timestamp: Date.now() }
  }

  const userId = authData.user.id

  // 3. Crear registre a `membres` (numero_membre assignat per sequence)
  const { data: membre, error: membreError } = await supabase
    .from('membres')
    .insert({
      tipus: 'soci',
      nom: data.nom,
      cognom1: data.cognom1,
      cognom2: data.cognom2 || null,
      email: data.email,
      telefon: data.telefon,
      data_naixement: data.data_naixement || null,
    })
    .select('id, numero_membre')
    .single()

  if (membreError || !membre) {
    // Rollback: eliminar usuari auth
    await supabase.auth.admin.deleteUser(userId)
    return { error: 'Error intern creant el perfil. Torna-ho a intentar.' }
  }

  // 4. Crear registre a `socis`
  const esMenor = calcularEdat(data.data_naixement) < 18
  const { error: sociError } = await supabase.from('socis').insert({
    id: membre.id,
    user_id: userId,
    dni: dniUpper,
    adreca: data.adreca,
    codi_postal: data.codi_postal,
    poblacio: data.poblacio,
    provincia: data.provincia || null,
    pais: 'ES',
    genere: data.genere || null,
    talla_samarreta: data.talla_samarreta || null,
    consentiment_privacitat: true,
    consentiment_comunicacions: data.consentiment_comunicacions === 'on',
    estat: 'pendent_pagament',
    es_menor: esMenor,
    tutor_nom: esMenor ? (data.tutor_nom?.trim() || null) : null,
    tutor_dni: esMenor ? (data.tutor_dni?.toUpperCase() || null) : null,
    tutor_relacio: esMenor ? (data.tutor_relacio || null) : null,
  })

  if (sociError) {
    // Rollback
    await supabase.from('membres').delete().eq('id', membre.id)
    await supabase.auth.admin.deleteUser(userId)
    return { error: 'Error intern creant el perfil. Torna-ho a intentar.' }
  }

  // 5. Enviar email de benvinguda
  if (data.email) {
    await enviarEmail({
      templateId: 'confirmacio_registre',
      to: data.email,
      variables: {
        nom: data.nom,
        email: data.email,
        url_portal: `${process.env.NEXT_PUBLIC_APP_URL}/portal`,
      },
    })
  }

  redirect('/registre/confirmacio')
}
