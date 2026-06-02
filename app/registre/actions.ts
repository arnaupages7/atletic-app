'use server'

import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { RegistreSchema } from './schema'

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
  })

  if (sociError) {
    // Rollback
    await supabase.from('membres').delete().eq('id', membre.id)
    await supabase.auth.admin.deleteUser(userId)
    return { error: 'Error intern creant el perfil. Torna-ho a intentar.' }
  }

  // 5. Crear Stripe Checkout Session
  let checkoutUrl: string
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: data.email,
      line_items: [
        { price: process.env.STRIPE_PRICE_SOCI!, quantity: 1 },
      ],
      metadata: {
        soci_id: membre.id,
        user_id: userId,
        numero_membre: String(membre.numero_membre),
      },
      subscription_data: {
        metadata: {
          soci_id: membre.id,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/exit?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/exit?status=cancel`,
    })
    checkoutUrl = session.url!
  } catch (stripeErr) {
    // Rollback
    await supabase.from('membres').delete().eq('id', membre.id)
    await supabase.auth.admin.deleteUser(userId)
    return { error: 'Error connectant amb el servei de pagament. Torna-ho a intentar.' }
  }

  redirect(checkoutUrl)
}
