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
