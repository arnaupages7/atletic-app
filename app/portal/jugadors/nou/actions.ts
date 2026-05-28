'use server'

import { redirect } from 'next/navigation'
import { Resend } from 'resend'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { InscripcioJugadorSchema } from './schema'

export type InscripcioState =
  | {
      errors?: Record<string, string[]>
      error?: string
    }
  | undefined

// Extensió màxima de fitxer: 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const TEMPORADA_ACTUAL = '2025-26'

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

  // ── 3. Validar foto ──────────────────────────────────────────
  const fotoFile = formData.get('foto_fitxa') as File | null

  if (!fotoFile || fotoFile.size === 0) {
    return { errors: { foto_fitxa: ['La foto del jugador és obligatòria.'] } }
  }
  if (!ACCEPTED_IMAGE_TYPES.includes(fotoFile.type)) {
    return { errors: { foto_fitxa: ['Formats acceptats: JPG, PNG o WebP.'] } }
  }
  if (fotoFile.size > MAX_FILE_SIZE) {
    return { errors: { foto_fitxa: ['La foto no pot superar els 5 MB.'] } }
  }

  // ── 4. Validar resta del formulari (Zod) ─────────────────────
  const raw = Object.fromEntries(formData.entries())
  // Treure foto del raw perquè Zod no la reconeix com a string
  delete (raw as Record<string, unknown>).foto_fitxa

  const parsed = InscripcioJugadorSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const {
    nom,
    cognom1,
    cognom2,
    data_naixement,
    genere,
    dni,
    equip_id,
    talla_samarreta,
    adreca,
    telefon,
    num_catsalut,
    consentiment_comunicacions,
  } = parsed.data

  const serviceSupabase = await createServiceClient()

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

  // ── 6. Pujar foto a Supabase Storage ─────────────────────────
  const ext = fotoFile.name.split('.').pop()?.toLowerCase() || 'jpg'
  const storagePath = `jugadors/${membre.id}/foto-fitxa.${ext}`

  const fotoBuffer = Buffer.from(await fotoFile.arrayBuffer())

  const { error: uploadError } = await serviceSupabase.storage
    .from('documents')
    .upload(storagePath, fotoBuffer, {
      contentType: fotoFile.type,
      upsert: false,
    })

  if (uploadError) {
    // Rollback membre
    await serviceSupabase.from('membres').delete().eq('id', membre.id)
    console.error('inscripcio: error pujant foto', uploadError)
    return { error: 'Error pujant la foto. Comprova el format i mida, i torna-ho a intentar.' }
  }

  // ── 7. Crear entrada a `jugadors` ────────────────────────────
  const { error: jugadorError } = await serviceSupabase
    .from('jugadors')
    .insert({
      id: membre.id,
      soci_responsable_id: soci.id,
      equip_id,
      temporada: TEMPORADA_ACTUAL,
      foto_fitxa_url: storagePath, // ruta relativa al bucket
      num_catsalut,
      talla_samarreta,
      genere: genere || null,
      dni,
      adreca,
      consentiment_privacitat: true,
      consentiment_comunicacions: consentiment_comunicacions === 'on',
      estat: 'pendent_aprovacio',
    })

  if (jugadorError) {
    // Rollback: treure foto + membre
    await serviceSupabase.storage.from('documents').remove([storagePath])
    await serviceSupabase.from('membres').delete().eq('id', membre.id)
    console.error('inscripcio: error creant jugador', jugadorError)
    return { error: 'Error intern registrant la inscripció. Torna-ho a intentar.' }
  }

  // ── 8. Email de notificació als gestors (no bloquejant) ──────
  try {
    const { data: equipData } = await serviceSupabase
      .from('equips')
      .select('nom')
      .eq('id', equip_id)
      .single()

    const { data: membreSoci } = await serviceSupabase
      .from('membres')
      .select('nom, cognom1')
      .eq('id', soci.id)
      .single()

    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: `Atlètic Club Banyoles <${process.env.RESEND_FROM_EMAIL ?? 'administracio@atletic.cat'}>`,
      to: 'administracio@atletic.cat',
      subject: `Nova inscripció de jugador — ${nom} ${cognom1}`,
      html: `
        <h2>Nova sol·licitud d'inscripció de jugador</h2>
        <table style="border-collapse:collapse;width:100%;max-width:480px">
          <tr><td style="padding:6px 12px;font-weight:600">Jugador</td><td style="padding:6px 12px">${nom} ${cognom1}${cognom2 ? ' ' + cognom2 : ''}</td></tr>
          <tr style="background:#f5f5f5"><td style="padding:6px 12px;font-weight:600">Data naix.</td><td style="padding:6px 12px">${data_naixement}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:600">Equip</td><td style="padding:6px 12px">${equipData?.nom ?? equip_id}</td></tr>
          <tr style="background:#f5f5f5"><td style="padding:6px 12px;font-weight:600">Temporada</td><td style="padding:6px 12px">${TEMPORADA_ACTUAL}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:600">Núm. membre</td><td style="padding:6px 12px">#${membre.numero_membre}</td></tr>
          <tr style="background:#f5f5f5"><td style="padding:6px 12px;font-weight:600">Tutor</td><td style="padding:6px 12px">${membreSoci ? `${membreSoci.nom} ${membreSoci.cognom1}` : user.email}</td></tr>
        </table>
        <p style="margin-top:24px">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/backoffice/jugadors" style="background:#1a1a1a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">
            Revisar al backoffice
          </a>
        </p>
        <p style="color:#888;font-size:12px;margin-top:32px">Atlètic Club Banyoles — portal.atletic.cat</p>
      `,
    })
  } catch (emailError) {
    // L'email falla silenciosament — la inscripció queda registrada
    console.error('inscripcio: error enviant email notificació', emailError)
  }

  // ── 9. Redirigir al llistat de jugadors ─────────────────────
  redirect('/portal/jugadors?nova=1')
}
