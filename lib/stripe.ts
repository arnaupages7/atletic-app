import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
  typescript: true,
})

// Preus Stripe
export const STRIPE_PRICES = {
  SOCI: process.env.STRIPE_PRICE_SOCI!,
  DESCOMPTE_GERMA: process.env.STRIPE_PRICE_DESCOMPTE_GERMA!,
} as const

// Verificació de webhook Stripe
export function constructWebhookEvent(payload: string, signature: string) {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )
}
