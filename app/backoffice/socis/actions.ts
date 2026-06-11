'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { enviarEmail } from '@/lib/email'
import { stripe } from '@/lib/stripe'

// ── Donar de baixa ───────────────────────────────────────────────────────────

export async function baixaSociAction(
  sociId: string
): Promise<{ ok?: boolean; error?: string }> {
  try {
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
    if (!gestor || gestor.rol !== 'admin') return { error: 'No tens permís.' }

    const { data: soci } = await serviceSupabase
      .from('socis')
      .select('estat, stripe_customer_id')
      .eq('id', sociId)
      .single()

    if (!soci) return { error: 'Soci no trobat.' }
    if (soci.estat === 'baixa') return { error: 'Aquest soci ja està de baixa.' }

    // Cancel·lar subscripció activa de Stripe si en té
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

    const { error } = await serviceSupabase
      .from('socis')
      .update({ estat: 'baixa' })
      .eq('id', sociId)

    if (error) return { error: 'Error actualitzant l\'estat del soci.' }

    revalidatePath('/backoffice/socis')
    return { ok: true }
  } catch (err: unknown) {
    if (isRedirectError(err)) throw err
    console.error('[baixaSociAction]', err)
    return { error: 'Error inesperat.' }
  }
}

// ── Reenviar correu de benvinguda ─────────────────────────────────────────────

export async function reenviarBenvingudaAction(
  sociId: string
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceSupabase = await createServiceClient()

  const { data: gestor } = await serviceSupabase
    .from('gestors')
    .select('id')
    .eq('user_id', user.id)
    .eq('actiu', true)
    .single()
  if (!gestor) return { error: 'No tens permís.' }

  const { data: membre } = await serviceSupabase
    .from('membres')
    .select('nom, email')
    .eq('id', sociId)
    .single()

  if (!membre?.email) return { error: 'Aquest soci no té correu registrat.' }

  try {
    await enviarEmail({
      templateId: 'confirmacio_registre',
      to: membre.email,
      variables: {
        nom: membre.nom,
        email: membre.email,
        url_portal: `${process.env.NEXT_PUBLIC_APP_URL}/portal`,
      },
    })
  } catch {
    return { error: 'Error enviant el correu.' }
  }

  return { ok: true }
}
