'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
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

// ── Temporada activa ──────────────────────────────────────────────────────────

export async function desarTemporadaAction(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const supabase = await verificarAdmin()

    const temporada = (formData.get('temporada_activa') as string | null)?.trim()
    if (!temporada || !/^\d{4}-\d{2}$/.test(temporada)) {
      return { error: 'Format incorrecte. Exemple: 2026-27' }
    }

    await supabase
      .from('configuracio')
      .upsert({ clau: 'temporada_activa', valor: temporada, actualitzat_el: new Date().toISOString() })

    revalidatePath('/backoffice')
    revalidatePath('/backoffice/configuracio')
    revalidatePath('/portal/jugadors/nou')
    return { success: true }
  } catch (err: unknown) {
    if (isRedirectError(err)) throw err
    console.error('[desarTemporadaAction]', err)
    return { error: 'Error desant la temporada.' }
  }
}

// ── Layout carnet ─────────────────────────────────────────────────────────────

export async function desarCarnetLayoutAction(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  elements: any[]
): Promise<{ error?: string }> {
  try {
    const supabase = await verificarAdmin()

    await supabase
      .from('configuracio')
      .upsert({
        clau: 'carnet_layout',
        valor: JSON.stringify(elements),
        actualitzat_el: new Date().toISOString(),
      })

    revalidatePath('/backoffice/configuracio')
    revalidatePath('/portal/carnet')
    return {}
  } catch (err: unknown) {
    if (isRedirectError(err)) throw err
    console.error('[desarCarnetLayoutAction]', err)
    return { error: 'Error desant el layout.' }
  }
}

// ── Configuració general ──────────────────────────────────────────────────────

export async function desarConfiguracioGeneralAction(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const supabase = await verificarAdmin()

    const carnetFonsUrl = (formData.get('carnet_fons_url') as string | null)?.trim() || null

    await supabase
      .from('configuracio')
      .upsert({ clau: 'carnet_fons_url', valor: carnetFonsUrl, actualitzat_el: new Date().toISOString() })

    revalidatePath('/backoffice/configuracio')
    revalidatePath('/portal/carnet')
    return { success: true }
  } catch (err: unknown) {
    if (isRedirectError(err)) throw err
    console.error('[desarConfiguracioGeneralAction]', err)
    return { error: 'Error desant la configuració.' }
  }
}

// ── Configuració per equips ───────────────────────────────────────────────────

export async function desarConfigEquipsAction(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const supabase = await verificarAdmin()

    const equipIds = ((formData.get('equip_ids') as string | null) ?? '')
      .split(',')
      .filter(Boolean)

    for (const id of equipIds) {
      const preuRaw = formData.get(`preu_${id}`) as string | null
      const sociAutomatic = formData.get(`soci_automatic_${id}`) === 'on'
      const preuInscripcio = preuRaw && preuRaw.trim() !== '' ? parseInt(preuRaw, 10) : null

      const { error } = await supabase
        .from('equips')
        .update({ preu_inscripcio: preuInscripcio, soci_automatic: sociAutomatic })
        .eq('id', id)

      if (error) {
        console.error(`[desarConfigEquipsAction] Error equip ${id}:`, error)
        return { error: 'Error desant la configuració dels equips.' }
      }
    }

    revalidatePath('/backoffice/configuracio')
    return { success: true }
  } catch (err: unknown) {
    if (isRedirectError(err)) throw err
    console.error('[desarConfigEquipsAction]', err)
    return { error: 'Error inesperat.' }
  }
}

// ── Preu per defecte jugadors ─────────────────────────────────────────────────

export async function desarPreuDefecteAction(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const supabase = await verificarAdmin()

    const preuRaw = (formData.get('preu_defecte') as string | null)?.trim()
    if (!preuRaw || isNaN(Number(preuRaw)) || Number(preuRaw) < 0) {
      return { error: 'Introdueix un preu vàlid en euros.' }
    }

    const preuCents = Math.round(parseFloat(preuRaw) * 100)

    await supabase
      .from('configuracio')
      .upsert({ clau: 'preu_defecte_jugador', valor: String(preuCents), actualitzat_el: new Date().toISOString() })

    revalidatePath('/backoffice/configuracio')
    return { success: true }
  } catch (err: unknown) {
    if (isRedirectError(err)) throw err
    console.error('[desarPreuDefecteAction]', err)
    return { error: 'Error desant el preu.' }
  }
}

// ── Descompte germà ───────────────────────────────────────────────────────────

export async function desarDescompteGermaAction(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const supabase = await verificarAdmin()

    const tipus = (formData.get('descompte_germa_tipus') as string | null)?.trim()
    const valorRaw = (formData.get('descompte_germa_valor') as string | null)?.trim()

    if (!tipus || !['import_fix', 'percentatge'].includes(tipus)) {
      return { error: 'Tipus de descompte no vàlid.' }
    }
    if (!valorRaw || isNaN(Number(valorRaw)) || Number(valorRaw) < 0) {
      return { error: 'Introdueix un valor vàlid.' }
    }
    if (tipus === 'percentatge' && parseFloat(valorRaw) > 100) {
      return { error: 'El percentatge no pot superar el 100%.' }
    }

    await supabase.from('configuracio').upsert([
      { clau: 'descompte_germa_tipus', valor: tipus, actualitzat_el: new Date().toISOString() },
      { clau: 'descompte_germa_valor', valor: valorRaw, actualitzat_el: new Date().toISOString() },
    ])

    revalidatePath('/backoffice/configuracio')
    return { success: true }
  } catch (err: unknown) {
    if (isRedirectError(err)) throw err
    console.error('[desarDescompteGermaAction]', err)
    return { error: 'Error desant el descompte.' }
  }
}

// ── Plantilles de correu ──────────────────────────────────────────────────────

export async function desarPlantillaAction(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const supabase = await verificarAdmin()

    const id = formData.get('id') as string
    const assumpte = (formData.get('assumpte') as string | null)?.trim()
    const cosHtml = (formData.get('cos_html') as string | null)?.trim()

    if (!id || !assumpte || !cosHtml) {
      return { error: 'Tots els camps són obligatoris.' }
    }

    const { error } = await supabase
      .from('email_templates')
      .update({ assumpte, cos_html: cosHtml, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('[desarPlantillaAction]', error)
      return { error: 'Error desant la plantilla.' }
    }

    revalidatePath('/backoffice/configuracio')
    return { success: true }
  } catch (err: unknown) {
    if (isRedirectError(err)) throw err
    console.error('[desarPlantillaAction]', err)
    return { error: 'Error inesperat.' }
  }
}
