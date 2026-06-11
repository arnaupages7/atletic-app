'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { resend } from '@/lib/resend'
import type { TallaSamarreta } from '@/lib/supabase/types'

async function verificarGestor() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceSupabase = await createServiceClient()
  const { data: gestor } = await serviceSupabase
    .from('gestors')
    .select('rol')
    .eq('user_id', user.id)
    .eq('actiu', true)
    .single()
  if (!gestor) redirect('/backoffice')
  return { serviceSupabase, rol: gestor.rol }
}

// ── Editar dades soci ──────────────────────────────────────────────────────────

export type EditarSociState = { error?: string; success?: boolean } | undefined

export async function editarSociAction(
  sociId: string,
  _prevState: EditarSociState,
  formData: FormData
): Promise<EditarSociState> {
  try {
    const { serviceSupabase, rol } = await verificarGestor()
    if (rol !== 'admin') return { error: 'Només els administradors poden editar dades de socis.' }

    const nom = (formData.get('nom') as string)?.trim()
    const cognom1 = (formData.get('cognom1') as string)?.trim()
    const cognom2 = (formData.get('cognom2') as string)?.trim() || null
    const email = (formData.get('email') as string)?.trim() || null
    const telefon = (formData.get('telefon') as string)?.trim() || null
    const dataNaixement = (formData.get('data_naixement') as string)?.trim() || null
    const adreca = (formData.get('adreca') as string)?.trim() || null
    const codiPostal = (formData.get('codi_postal') as string)?.trim() || null
    const poblacio = (formData.get('poblacio') as string)?.trim() || null
    const genere = (formData.get('genere') as string)?.trim() || null
    const tallaSamarreta = ((formData.get('talla_samarreta') as string)?.trim() || null) as TallaSamarreta | null

    if (!nom || !cognom1) return { error: 'El nom i el primer cognom són obligatoris.' }

    // Obtenir email actual per enviar notificació
    const { data: membreActual } = await serviceSupabase
      .from('membres')
      .select('email, nom')
      .eq('id', sociId)
      .single()

    const emailNotificacio = email ?? membreActual?.email

    // Actualitzar membres
    const { error: membreError } = await serviceSupabase
      .from('membres')
      .update({ nom, cognom1, cognom2, email, telefon, data_naixement: dataNaixement })
      .eq('id', sociId)

    if (membreError) return { error: 'Error actualitzant les dades del membre.' }

    // Actualitzar socis
    const { error: sociError } = await serviceSupabase
      .from('socis')
      .update({ adreca, codi_postal: codiPostal, poblacio, genere: genere || null, talla_samarreta: tallaSamarreta || null })
      .eq('id', sociId)

    if (sociError) return { error: 'Error actualitzant les dades del soci.' }

    // Notificació al soci per correu
    if (emailNotificacio) {
      try {
        await resend.emails.send({
          from: 'Atlètic Club Banyoles <no-reply@atletic.cat>',
          to: emailNotificacio,
          subject: 'Les teves dades han estat actualitzades',
          html: `
            <p>Hola ${nom},</p>
            <p>El club ha actualitzat les teves dades personals al sistema de gestió.</p>
            <p>Si no esperaves aquest canvi o creus que és un error, posa't en contacte amb el club.</p>
            <hr />
            <p style="color:#999;font-size:12px;">Atlètic Club Banyoles</p>
          `,
        })
      } catch {
        // No bloquejant
      }
    }

    revalidatePath(`/backoffice/socis/${sociId}`)
    revalidatePath('/backoffice/socis')
    return { success: true }
  } catch (err: unknown) {
    if (isRedirectError(err)) throw err
    console.error('[editarSociAction]', err)
    return { error: 'Error inesperat.' }
  }
}

// ── Donar de baixa ─────────────────────────────────────────────────────────────

export async function baixaSociAction(
  sociId: string
): Promise<{ ok?: boolean; error?: string }> {
  try {
    const { serviceSupabase } = await verificarGestor()

    const { data: soci } = await serviceSupabase
      .from('socis')
      .select('estat, stripe_customer_id')
      .eq('id', sociId)
      .single()

    if (!soci) return { error: 'Soci no trobat.' }
    if (soci.estat === 'baixa') return { error: 'Aquest soci ja està de baixa.' }

    if (soci.stripe_customer_id) {
      const subscriptions = await stripe.subscriptions.list({
        customer: soci.stripe_customer_id,
        status: 'active',
        limit: 10,
      })
      for (const sub of subscriptions.data) {
        await stripe.subscriptions.cancel(sub.id)
      }
    }

    await serviceSupabase.from('socis').update({ estat: 'baixa' }).eq('id', sociId)

    revalidatePath(`/backoffice/socis/${sociId}`)
    revalidatePath('/backoffice/socis')
    return { ok: true }
  } catch (err: unknown) {
    if (isRedirectError(err)) throw err
    console.error('[baixaSociAction]', err)
    return { error: 'Error inesperat.' }
  }
}

// ── Eliminar soci ──────────────────────────────────────────────────────────────

export async function eliminarSociAction(
  sociId: string
): Promise<{ ok?: boolean; error?: string }> {
  try {
    const { serviceSupabase, rol } = await verificarGestor()
    if (rol !== 'admin') return { error: 'Només els administradors poden eliminar socis.' }

    const { data: soci } = await serviceSupabase
      .from('socis')
      .select('stripe_customer_id, user_id')
      .eq('id', sociId)
      .single()

    if (!soci) return { error: 'Soci no trobat.' }

    // Cancel·lar subscripció Stripe si n'hi ha
    if (soci.stripe_customer_id) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: soci.stripe_customer_id,
          status: 'active',
          limit: 10,
        })
        for (const sub of subscriptions.data) {
          await stripe.subscriptions.cancel(sub.id)
        }
      } catch { /* no bloquejant */ }
    }

    // Esborrar pagaments (ON DELETE RESTRICT)
    await serviceSupabase.from('pagaments').delete().eq('membre_id', sociId)

    // Esborrar membre (cascadeja a socis)
    await serviceSupabase.from('membres').delete().eq('id', sociId)

    revalidatePath('/backoffice/socis')
    redirect('/backoffice/socis')
  } catch (err: unknown) {
    if (isRedirectError(err)) throw err
    console.error('[eliminarSociAction]', err)
    return { error: 'Error eliminant el soci.' }
  }
}
