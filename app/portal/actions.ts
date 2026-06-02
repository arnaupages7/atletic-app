'use server'

import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function pagarQuotaSociAction(): Promise<void> {
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

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: membre.email ?? undefined,
      line_items: [{ price: process.env.STRIPE_PRICE_SOCI!, quantity: 1 }],
      metadata: {
        soci_id: soci.id,
        user_id: user.id,
        numero_membre: String(membre.numero_membre),
      },
      subscription_data: {
        metadata: {
          soci_id: soci.id,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/exit?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/portal`,
    })

    redirect(session.url!)
  } catch (err: unknown) {
    if (isRedirectError(err)) throw err
    console.error('[pagarQuotaSociAction] error:', err)
    redirect('/portal?error=pagament')
  }
}
