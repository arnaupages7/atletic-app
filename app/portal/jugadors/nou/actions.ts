'use server'

import { redirect } from 'next/navigation'
import { resend } from '@/lib/resend'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { InscripcioJugadorSchema } from './schema'

export type InscripcioState =
  | {
      errors?: Record<string, string[]>
      error?: string
      /** Valors enviats — per repoblar el formulari en cas d'error */
      values?: Record<string, string>
      timestamp?: number
    }
  | undefined

function extractValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of formData.entries()) {
    if (typeof v === 'string') out[k] = v
  }
  return out
}

// Extensió màxima de fitxer: 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export async function inscriureJugadorAction(
  _prevState: InscripcioState,
  formData: FormData
): Promise<InscripcioState> {
  // ── 1. Autenticació ─────────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // ── 2. Obtenir soci + verificar que és actiu ─────────────────
  const { data: soci } = await supabase
    .from('socis')
    .select('id, estat')
    .eq('user_id', user.id)
    .single()

  if (!soci) return { error: 'No s\'hem trobat el teu perfil de soci.' }

  if (soci.estat !== 'actiu') {
    return {
      error:
        'Has de tenir la quota de soci al dia (estat actiu) per inscriure jugadors.',
    }
  }

  // ── 3. Validar arxius ────────────────────────────────────────
  const fotoFile = formData.get('foto_fitxa') as File | null
  const dniDavantFile = formData.get('dni_davant') as File | null
  const dniDarrereFile = formData.get('dni_darrere') as File | null

  const fileErrors: Record<string, string[]> = {}

  // Foto fitxa
  if (!fotoFile || fotoFile.size === 0) {
    fileErrors.foto_fitxa = ['La foto del jugador és obligatòria.']
  } else if (!ACCEPTED_IMAGE_TYPES.includes(fotoFile.type)) {
    fileErrors.foto_fitxa = ['Formats acceptats: JPG, PNG o WebP.']
  } else if (fotoFile.size > MAX_FILE_SIZE) {
    fileErrors.foto_fitxa = ['La foto no pot superar els 5 MB.']
  }

  // DNI davant
  if (!dniDavantFile || dniDavantFile.size === 0) {
    fileErrors.dni_davant = ['La foto de la cara davantera del DNI és obligatòria.']
  } else if (!ACCEPTED_IMAGE_TYPES.includes(dniDavantFile.type)) {
    fileErrors.dni_davant = ['Formats acceptats: JPG, PNG o WebP.']
  } else if (dniDavantFile.size > MAX_FILE_SIZE) {
    fileErrors.dni_davant = ['El document no pot superar els 5 MB.']
  }

  // DNI darrere
  if (!dniDarrereFile || dniDarrereFile.size === 0) {
    fileErrors.dni_darrere = ['La foto de la cara posterior del DNI és obligatòria.']
  } else if (!ACCEPTED_IMAGE_TYPES.includes(dniDarrereFile.type)) {
    fileErrors.dni_darrere = ['Formats acceptats: JPG, PNG o WebP.']
  } else if (dniDarrereFile.size > MAX_FILE_SIZE) {
    fileErrors.dni_darrere = ['El document no pot superar els 5 MB.']
  }

  if (Object.keys(fileErrors).length > 0) {
    return { errors: fileErrors, values: extractValues(formData), timestamp: Date.now() }
  }

  // ── 4. Validar resta del formulari (Zod) ─────────────────────
  const raw = Object.fromEntries(formData.entries())
  // Treure arxius del raw perquè Zod no els reconeix com a strings
  delete (raw as Record<string, unknown>).foto_fitxa
  delete (raw as Record<string, unknown>).dni_davant
  delete (raw as Record<string, unknown>).dni_darrere

  const parsed = InscripcioJugadorSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      values: extractValues(formData),
      timestamp: Date.now(),
    }
  }

  const {
    nom,
    cognom1,
    cognom2,
    data_naixement,
    genere,
    equip_id,
    talla_samarreta,
    adreca,
    telefon,
    num_catsalut,
    consentiment_comunicacions,
    compromis_desplacaments,
  } = parsed.data

  const serviceSupabase = await createServiceClient()

  // ── 4a. Obtenir temporada activa de la configuració ──────────
  const { data: temporadaRow } = await serviceSupabase
    .from('configuracio')
    .select('valor')
    .eq('clau', 'temporada_activa')
    .single()
  const temporadaActual = temporadaRow?.valor ?? '2025-26'

  // ── 4b. Comprovar que el DNI no estigui duplicat ─────────────
  // Nota: excloem el propi soci de la comprovació perquè un soci pot
  // inscriure's ell mateix com a jugador (p.ex. primer equip).
  const dniUpper = parsed.data.dni.toUpperCase()
  const [{ count: dniSociAlt }, { count: dniJugador }] = await Promise.all([
    serviceSupabase
      .from('socis')
      .select('id', { count: 'exact', head: true })
      .eq('dni', dniUpper)
      .neq('id', soci.id),
    serviceSupabase
      .from('jugadors')
      .select('id', { count: 'exact', head: true })
      .eq('dni', dniUpper),
  ])
  if ((dniSociAlt ?? 0) > 0 || (dniJugador ?? 0) > 0) {
    return {
      errors: { dni: ['Aquest DNI/NIE ja està registrat al sistema.'] },
      values: extractValues(formData),
      timestamp: Date.now(),
    }
  }

  // ── 5. Crear entrada a `membres` ─────────────────────────────
  const { data: membre, error: membreError } = await serviceSupabase
    .from('membres')
    .insert({
      tipus: 'jugador',
      nom,
      cognom1,
      cognom2: cognom2 || null,
      telefon: telefon || null,
      data_naixement: data_naixement || null,
    })
    .select('id, numero_membre')
    .single()

  if (membreError || !membre) {
    console.error('inscripcio: error creant membre', membreError)
    return { error: 'Error intern creant el perfil del jugador. Torna-ho a intentar.' }
  }

  // ── 6. Pujar arxius a Supabase Storage ──────────────────────
  const fotoExt = fotoFile!.name.split('.').pop()?.toLowerCase() || 'jpg'
  const dniDavantExt = dniDavantFile!.name.split('.').pop()?.toLowerCase() || 'jpg'
  const dniDarrereExt = dniDarrereFile!.name.split('.').pop()?.toLowerCase() || 'jpg'

  const fotoPath = `jugadors/${membre.id}/foto-fitxa.${fotoExt}`
  const dniDavantPath = `jugadors/${membre.id}/dni-davant.${dniDavantExt}`
  const dniDarrere = `jugadors/${membre.id}/dni-darrere.${dniDarrereExt}`

  const uploadedPaths: string[] = []

  const uploadArxiu = async (file: File, path: string): Promise<string | null> => {
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error } = await serviceSupabase.storage
      .from('documents')
      .upload(path, buffer, { contentType: file.type, upsert: false })
    if (error) return error.message
    uploadedPaths.push(path)
    return null
  }

  const fotoError = await uploadArxiu(fotoFile!, fotoPath)
  if (fotoError) {
    await serviceSupabase.from('membres').delete().eq('id', membre.id)
    console.error('inscripcio: error pujant foto fitxa', fotoError)
    return { error: 'Error pujant la foto de fitxa. Comprova el format i mida, i torna-ho a intentar.' }
  }

  const dniDavantError = await uploadArxiu(dniDavantFile!, dniDavantPath)
  if (dniDavantError) {
    await serviceSupabase.storage.from('documents').remove(uploadedPaths)
    await serviceSupabase.from('membres').delete().eq('id', membre.id)
    console.error('inscripcio: error pujant dni davant', dniDavantError)
    return { error: 'Error pujant la foto del DNI (cara davantera). Torna-ho a intentar.' }
  }

  const dniDarrereError = await uploadArxiu(dniDarrereFile!, dniDarrere)
  if (dniDarrereError) {
    await serviceSupabase.storage.from('documents').remove(uploadedPaths)
    await serviceSupabase.from('membres').delete().eq('id', membre.id)
    console.error('inscripcio: error pujant dni darrere', dniDarrereError)
    return { error: 'Error pujant la foto del DNI (cara posterior). Torna-ho a intentar.' }
  }

  // ── 7. Crear entrada a `jugadors` ────────────────────────────
  const { error: jugadorError } = await serviceSupabase
    .from('jugadors')
    .insert({
      id: membre.id,
      soci_responsable_id: soci.id,
      equip_id,
      temporada: temporadaActual,
      foto_fitxa_url: fotoPath,
      document_dni_url: dniDavantPath,
      document_dni_darrere_url: dniDarrere,
      num_catsalut,
      talla_samarreta,
      genere: genere || null,
      dni: dniUpper,
      adreca,
      consentiment_privacitat: true,
      consentiment_comunicacions: consentiment_comunicacions === 'on',
      compromis_desplacaments: compromis_desplacaments === 'on',
      estat: 'pendent_aprovacio',
    })

  if (jugadorError) {
    // Rollback: treure arxius + membre
    await serviceSupabase.storage.from('documents').remove(uploadedPaths)
    await serviceSupabase.from('membres').delete().eq('id', membre.id)
    console.error('inscripcio: error creant jugador', jugadorError)
    return { error: 'Error intern registrant la inscripció. Torna-ho a intentar.' }
  }

  // ── 8. Emails de notificació (no bloquejants) ───────────────
  try {
    const { data: equipData } = await serviceSupabase
      .from('equips')
      .select('nom')
      .eq('id', equip_id)
      .single()

    const { data: membreSoci } = await serviceSupabase
      .from('membres')
      .select('nom, cognom1, email')
      .eq('id', soci.id)
      .single()

    const from = process.env.EMAIL_FROM ?? 'Atlètic Club Banyoles <no-reply@atleticbanyoles.cat>'
    const nomEquip = equipData?.nom ?? equip_id
    const nomJugador = `${nom} ${cognom1}${cognom2 ? ' ' + cognom2 : ''}`
    const urlPortal = process.env.NEXT_PUBLIC_APP_URL ?? 'https://portal.atletic.cat'

    // 8a. Notificació al backoffice
    await resend.emails.send({
      from,
      to: process.env.EMAIL_ADMIN ?? 'administracio@atletic.cat',
      subject: `Nova inscripció de jugador — ${nomJugador}`,
      html: `
        <h2>Nova sol·licitud d'inscripció de jugador</h2>
        <table style="border-collapse:collapse;width:100%;max-width:480px">
          <tr><td style="padding:6px 12px;font-weight:600">Jugador</td><td style="padding:6px 12px">${nomJugador}</td></tr>
          <tr style="background:#f5f5f5"><td style="padding:6px 12px;font-weight:600">Data naix.</td><td style="padding:6px 12px">${data_naixement}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:600">Equip</td><td style="padding:6px 12px">${nomEquip}</td></tr>
          <tr style="background:#f5f5f5"><td style="padding:6px 12px;font-weight:600">Temporada</td><td style="padding:6px 12px">${temporadaActual}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:600">Núm. membre</td><td style="padding:6px 12px">#${membre.numero_membre}</td></tr>
          <tr style="background:#f5f5f5"><td style="padding:6px 12px;font-weight:600">Tutor</td><td style="padding:6px 12px">${membreSoci ? `${membreSoci.nom} ${membreSoci.cognom1}` : user.email}</td></tr>
        </table>
        <p style="margin-top:24px">
          <a href="${urlPortal}/backoffice/jugadors" style="background:#1a1a1a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">
            Revisar al backoffice
          </a>
        </p>
        <p style="color:#888;font-size:12px;margin-top:32px">Atlètic Club Banyoles — portal.atletic.cat</p>
      `,
    })

    // 8b. Confirmació al soci que ha fet la inscripció
    const emailSoci = membreSoci?.email ?? user.email
    if (emailSoci) {
      await resend.emails.send({
        from,
        to: emailSoci,
        subject: `Sol·licitud d'inscripció rebuda — ${nomJugador}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
            <h2 style="color:#1a1a1a">Sol·licitud d'inscripció rebuda</h2>
            <p>Hem rebut la sol·licitud d'inscripció per al jugador <strong>${nomJugador}</strong> a l'equip <strong>${nomEquip}</strong>.</p>
            <p>L'equip tècnic del club revisarà la sol·licitud i et notificarem quan estigui aprovada. Un cop aprovada, rebràs les instruccions per completar el pagament.</p>
            <table style="border-collapse:collapse;width:100%;margin:24px 0">
              <tr><td style="padding:6px 12px;font-weight:600;background:#f5f5f5">Jugador</td><td style="padding:6px 12px">${nomJugador}</td></tr>
              <tr><td style="padding:6px 12px;font-weight:600;background:#f5f5f5">Equip</td><td style="padding:6px 12px">${nomEquip}</td></tr>
              <tr><td style="padding:6px 12px;font-weight:600;background:#f5f5f5">Temporada</td><td style="padding:6px 12px">${temporadaActual}</td></tr>
              <tr><td style="padding:6px 12px;font-weight:600;background:#f5f5f5">Estat</td><td style="padding:6px 12px">Pendent d'aprovació</td></tr>
            </table>
            <p>
              <a href="${urlPortal}/portal/jugadors" style="background:#e85d04;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">
                Veure els meus jugadors
              </a>
            </p>
            <p style="color:#888;font-size:12px;margin-top:32px">Atlètic Club Banyoles — portal.atletic.cat</p>
          </div>
        `,
      })
    }
  } catch (emailError) {
    // L'email falla silenciosament — la inscripció queda registrada
    console.error('inscripcio: error enviant email notificació', emailError)
  }

  // ── 9. Redirigir al llistat de jugadors ─────────────────────
  redirect('/portal/jugadors?nova=1')
}
