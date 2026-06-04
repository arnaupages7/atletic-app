'use server'

import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function verificarAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const serviceSupabase = await createServiceClient()
  const { data: gestor } = await serviceSupabase
    .from('gestors')
    .select('rol')
    .eq('user_id', user.id)
    .eq('actiu', true)
    .single()
  if (!gestor || gestor.rol !== 'admin') redirect('/backoffice')
  return serviceSupabase
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export type EquipFormState = { error?: string; success?: boolean } | undefined

// ── Crear equip ───────────────────────────────────────────────────────────────

export async function crearEquipAction(
  _prev: EquipFormState,
  formData: FormData
): Promise<EquipFormState> {
  try {
    const supabase = await verificarAdmin()

    const nom = (formData.get('nom') as string | null)?.trim()
    const temporada = (formData.get('temporada') as string | null)?.trim()
    const slugInput = (formData.get('slug') as string | null)?.trim()
    const categoria = (formData.get('categoria') as string | null)?.trim() || null
    const preuRaw = formData.get('preu_inscripcio') as string | null
    const sociAutomatic = formData.get('soci_automatic') === 'on'
    const placesRaw = formData.get('places_disponibles') as string | null

    if (!nom || !temporada) return { error: 'El nom i la temporada són obligatoris.' }

    const slug = slugInput || slugify(nom)
    const preuInscripcio = preuRaw?.trim() ? parseInt(preuRaw, 10) : null
    const placesDisponibles = placesRaw?.trim() ? parseInt(placesRaw, 10) : null

    const { error } = await supabase.from('equips').insert({
      nom,
      slug,
      categoria,
      temporada,
      preu_inscripcio: preuInscripcio,
      soci_automatic: sociAutomatic,
      places_disponibles: placesDisponibles,
      actiu: true,
    })

    if (error) {
      console.error('[crearEquipAction]', error)
      if (error.code === '23505')
        return { error: 'Ja existeix un equip amb aquest slug. Canvia el nom o el slug manualment.' }
      return { error: "Error creant l'equip." }
    }

    revalidatePath('/backoffice/equips')
    revalidatePath('/portal/jugadors/nou')
  } catch (err) {
    if (isRedirectError(err)) throw err
    console.error('[crearEquipAction]', err)
    return { error: 'Error inesperat.' }
  }
  redirect('/backoffice/equips')
}

// ── Editar equip ──────────────────────────────────────────────────────────────

export async function editarEquipAction(
  equipId: string,
  _prev: EquipFormState,
  formData: FormData
): Promise<EquipFormState> {
  try {
    const supabase = await verificarAdmin()

    const nom = (formData.get('nom') as string | null)?.trim()
    const slugInput = (formData.get('slug') as string | null)?.trim()
    const categoria = (formData.get('categoria') as string | null)?.trim() || null
    const preuRaw = formData.get('preu_inscripcio') as string | null
    const sociAutomatic = formData.get('soci_automatic') === 'on'
    const placesRaw = formData.get('places_disponibles') as string | null
    const actiu = formData.get('actiu') === 'on'

    if (!nom) return { error: 'El nom és obligatori.' }

    const slug = slugInput || slugify(nom)
    const preuInscripcio = preuRaw?.trim() ? parseInt(preuRaw, 10) : null
    const placesDisponibles = placesRaw?.trim() ? parseInt(placesRaw, 10) : null

    const { error } = await supabase
      .from('equips')
      .update({ nom, slug, categoria, preu_inscripcio: preuInscripcio, soci_automatic: sociAutomatic, places_disponibles: placesDisponibles, actiu })
      .eq('id', equipId)

    if (error) {
      console.error('[editarEquipAction]', error)
      if (error.code === '23505') return { error: 'Ja existeix un equip amb aquest slug.' }
      return { error: "Error actualitzant l'equip." }
    }

    revalidatePath('/backoffice/equips')
    revalidatePath('/portal/jugadors/nou')
  } catch (err) {
    if (isRedirectError(err)) throw err
    console.error('[editarEquipAction]', err)
    return { error: 'Error inesperat.' }
  }
  redirect('/backoffice/equips')
}

// ── Clonar temporada ──────────────────────────────────────────────────────────

export async function clonarTemporadaAction(
  _prev: EquipFormState,
  formData: FormData
): Promise<EquipFormState> {
  try {
    const supabase = await verificarAdmin()

    const temporadaOrigen = (formData.get('temporada_origen') as string | null)?.trim()
    const temporadaDesti = (formData.get('temporada_desti') as string | null)?.trim()
    const actualitzarActiva = formData.get('actualitzar_activa') === 'on'

    if (!temporadaOrigen || !temporadaDesti) return { error: 'Falten les temporades.' }
    if (!/^\d{4}-\d{2}$/.test(temporadaDesti))
      return { error: 'Format incorrecte. Exemple: 2026-27' }
    if (temporadaOrigen === temporadaDesti)
      return { error: "La temporada destí ha de ser diferent de l'actual." }

    // Equips actius de la temporada origen
    const { data: equipsOrigen, error: fetchError } = await supabase
      .from('equips')
      .select('nom, slug, categoria, preu_inscripcio, soci_automatic, places_disponibles')
      .eq('temporada', temporadaOrigen)
      .eq('actiu', true)

    if (fetchError) return { error: 'Error obtenint els equips actuals.' }
    if (!equipsOrigen?.length) return { error: 'No hi ha equips actius a la temporada actual.' }

    // Comprovar que no existeixin equips per a la temporada destí
    const { count: existents } = await supabase
      .from('equips')
      .select('id', { count: 'exact', head: true })
      .eq('temporada', temporadaDesti)

    if ((existents ?? 0) > 0)
      return {
        error: `Ja existeixen equips a la temporada ${temporadaDesti}. Edita'ls directament o crea'n de nous.`,
      }

    // Generar slug únic afegint el sufix de la nova temporada
    const suffix = temporadaDesti.split('-')[1] // "27" de "2026-27"
    const nouEquips = equipsOrigen.map((e) => ({
      nom: e.nom,
      slug: `${slugify(e.nom)}-${suffix}`,
      categoria: e.categoria,
      temporada: temporadaDesti,
      preu_inscripcio: e.preu_inscripcio,
      soci_automatic: e.soci_automatic,
      places_disponibles: e.places_disponibles,
      actiu: true,
    }))

    const { error: insertError } = await supabase.from('equips').insert(nouEquips)
    if (insertError) {
      console.error('[clonarTemporadaAction]', insertError)
      return { error: "Error creant els equips nous. Comprova que no hi hagi slugs duplicats." }
    }

    if (actualitzarActiva) {
      await supabase.from('configuracio').upsert({
        clau: 'temporada_activa',
        valor: temporadaDesti,
        actualitzat_el: new Date().toISOString(),
      })
    }

    revalidatePath('/backoffice/equips')
    revalidatePath('/backoffice/configuracio')
    revalidatePath('/portal/jugadors/nou')
    return { success: true }
  } catch (err) {
    if (isRedirectError(err)) throw err
    console.error('[clonarTemporadaAction]', err)
    return { error: 'Error inesperat.' }
  }
}
