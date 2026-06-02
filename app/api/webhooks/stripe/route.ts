import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { enviarEmail } from '@/lib/email'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = constructWebhookEvent(body, signature)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      await handleCheckoutCompleted(session, supabase)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await handleSubscriptionDeleted(subscription, supabase)
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      // Només renovacions — el primer pagament ja el gestiona checkout.session.completed
      if (invoice.billing_reason === 'subscription_cycle') {
        await handleRenovacioSoci(invoice, supabase)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      await handlePagamentFallit(invoice, supabase)
      break
    }

    default:
      // Ignorar events no gestionats
      break
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
) {
  const jugadorId = session.metadata?.jugador_id

  // ── Pagament inscripció jugador ──────────────────────────
  if (jugadorId) {
    const sociResponsableId = session.metadata?.soci_responsable_id
    if (!sociResponsableId) return

    // Activar jugador
    await supabase
      .from('jugadors')
      .update({ estat: 'actiu' })
      .eq('id', jugadorId)

    // Registrar pagament sota el soci responsable (qui paga)
    await supabase.from('pagaments').insert({
      membre_id: sociResponsableId,
      stripe_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : (session.payment_intent?.id ?? null),
      concepte: 'quota_jugador',
      import: session.amount_total ?? 0,
      estat: 'completat',
      metadata: {
        jugador_id: jugadorId,
        numero_membre: session.metadata?.numero_membre ?? null,
        customer_email: session.customer_email,
      },
    })
    return
  }

  // ── Pagament quota soci ──────────────────────────────────
  const sociId = session.metadata?.soci_id
  if (!sociId) return

  // Actualitzar soci a 'actiu'
  await supabase
    .from('socis')
    .update({
      estat: 'actiu',
      stripe_customer_id: session.customer as string,
      data_alta: new Date().toISOString().split('T')[0],
    })
    .eq('id', sociId)

  // Registrar pagament
  await supabase.from('pagaments').insert({
    membre_id: sociId,
    stripe_session_id: session.id,
    stripe_payment_intent_id:
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent?.id ?? null),
    concepte: 'quota_soci',
    import: session.amount_total ?? 0,
    estat: 'completat',
    metadata: {
      stripe_subscription_id: session.subscription,
      customer_email: session.customer_email,
    },
  })

  // Enviar email de confirmació de pagament
  const customerEmail = session.customer_email
  const numeroMembre = session.metadata?.numero_membre
  if (customerEmail && numeroMembre) {
    const { data: membre } = await supabase
      .from('membres')
      .select('nom')
      .eq('id', sociId)
      .single()

    if (membre) {
      await enviarEmail({
        templateId: 'confirmacio_pagament',
        to: customerEmail,
        variables: {
          nom: membre.nom,
          numero_membre: numeroMembre,
          url_carnet: `${process.env.NEXT_PUBLIC_APP_URL}/portal/carnet`,
        },
      })
    }
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
) {
  const sociId = subscription.metadata?.soci_id
  if (!sociId) return

  await supabase
    .from('socis')
    .update({ estat: 'baixa' })
    .eq('id', sociId)
}

async function handleRenovacioSoci(
  invoice: Stripe.Invoice,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
  if (!customerId) return

  const { data: soci } = await supabase
    .from('socis')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!soci) return

  // Assegurar que segueix actiu i crear registre de pagament
  await supabase.from('socis').update({ estat: 'actiu' }).eq('id', soci.id)

  await supabase.from('pagaments').insert({
    membre_id: soci.id,
    stripe_session_id: null,
    stripe_payment_intent_id: null,
    concepte: 'quota_soci',
    import: invoice.amount_paid ?? 0,
    estat: 'completat',
    metadata: {
      stripe_invoice_id: invoice.id,
      billing_reason: 'renovacio_anual',
    },
  })
}

async function handlePagamentFallit(
  invoice: Stripe.Invoice,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
  if (!customerId) return

  const { data: soci } = await supabase
    .from('socis')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!soci) return

  // Marcar com a pendent — Stripe reintentarà automàticament
  // Si tots els reintents fallen, customer.subscription.deleted posarà l'estat a 'baixa'
  await supabase
    .from('socis')
    .update({ estat: 'pendent_pagament' })
    .eq('id', soci.id)
}
