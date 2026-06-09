'use server'

import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export type PagarState = { error?: string } | undefined

export async function pagarQuotaSociAction(
  _prevState: PagarState,
  formData: FormData
): Promise<PagarState> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const serviceSupabase = await createServiceClient()

    const { data: soci } = await serviceSupabase
      .from('socis')
      .select('id, estat')
      .eq('user_id', user.id)
      .single()

    if (!soci || soci.estat !== 'pendent_pagament') return

    const { data: membre } = await serviceSupabase
      .from('membres')
      .select('email, numero_membre')
      .eq('id', soci.id)
      .single()

    if (!membre) return

    // ── Validar cupó (opcional) ───────────────────────────────
    const codiCupo = ((formData.get('codi_cupo') as string | null) ?? '').trim().toUpperCase()
    let cupoId: string | null = null
    let stripeCouponId: string | null = null

    if (codiCupo) {
      const { data: cupo } = await serviceSupabase
        .from('cupons')
        .select('id, actiu, usos_maxims, usos_actuals, stripe_coupon_id, data_expiracio, aplicable_a')
        .eq('codi', codiCupo)
        .single()

      if (!cupo) return { error: `El cupó "${codiCupo}" no existeix.` }
      if (!cupo.actiu) return { error: 'Aquest cupó no és actiu.' }
      if (cupo.data_expiracio && new Date(cupo.data_expiracio) < new Date())
        return { error: 'Aquest cupó ha expirat.' }
      if (cupo.usos_maxims !== null && cupo.usos_actuals >= cupo.usos_maxims)
        return { error: 'Aquest cupó ja ha exhaurit els usos disponibles.' }
      if (cupo.aplicable_a === 'jugador')
        return { error: 'Aquest cupó no és vàlid per a la quota de soci.' }

      cupoId = cupo.id
      stripeCouponId = cupo.stripe_coupon_id
    }

    // ── Crear sessió Stripe ───────────────────────────────────
    const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      mode: 'subscription',
      customer_email: membre.email ?? undefined,
      line_items: [{ price: process.env.STRIPE_PRICE_SOCI!, quantity: 1 }],
      metadata: {
        soci_id: soci.id,
        user_id: user.id,
        numero_membre: String(membre.numero_membre),
        ...(cupoId ? { cuo_id: cupoId } : {}),
      },
      subscription_data: { metadata: { soci_id: soci.id } },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/exit?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/portal`,
    }

    // Aplicar cupó Stripe si n'hi ha
    if (stripeCouponId) {
      sessionParams.discounts = [{ coupon: stripeCouponId }]
    }

    const session = await stripe.checkout.sessions.create(sessionParams)
    redirect(session.url!)
  } catch (err: unknown) {
    if (isRedirectError(err)) throw err
    console.error('[pagarQuotaSociAction] error:', err)
    return { error: 'Error connectant amb el servei de pagament. Torna-ho a intentar.' }
  }
}

export async function gestionarSubscripcioAction(): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const serviceSupabase = await createServiceClient()
    const { data: soci } = await serviceSupabase
      .from('socis')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (!soci?.stripe_customer_id) {
      return { error: 'No s\'ha trobat una subscripció activa.' }
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: soci.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/portal`,
    })

    redirect(session.url)
  } catch (err: unknown) {
    if (isRedirectError(err)) throw err
    console.error('[gestionarSubscripcioAction] error:', err)
    return { error: 'Error connectant amb Stripe. Torna-ho a intentar.' }
  }
}
