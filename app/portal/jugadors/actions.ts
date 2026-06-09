'use server'

import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { importAmbKlarna } from '@/lib/klarna'
import { aplicarDescompteGerma } from '@/lib/descompte-germa'

export async function pagarQuotaJugadorAction(
  jugadorId: string,
  metodePagament: 'card' | 'bizum' | 'klarna' = 'card',
  codiCupo: string = ''
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceSupabase = await createServiceClient()

  // Verificar que el soci és el responsable del jugador
  const { data: soci } = await serviceSupabase
    .from('socis')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!soci) return { error: 'Soci no trobat.' }

  // Obtenir jugador + validar propietat + estat
  const { data: jugador } = await serviceSupabase
    .from('jugadors')
    .select(`
      id,
      estat,
      soci_responsable_id,
      temporada,
      equip_id,
      membres!inner(nom, cognom1, numero_membre),
      equips(nom)
    `)
    .eq('id', jugadorId)
    .eq('soci_responsable_id', soci.id)
    .single()

  if (!jugador) return { error: 'Jugador no trobat o no tens permís.' }

  if (jugador.estat !== 'aprovada') {
    return { error: 'Aquesta inscripció no està pendent de pagament.' }
  }

  // Obtenir email del soci
  const { data: sociMembre } = await serviceSupabase
    .from('membres')
    .select('nom, email')
    .eq('id', soci.id)
    .single()

  // Detectar descompte germà
  const { count: altresActius } = await serviceSupabase
    .from('jugadors')
    .select('id', { count: 'exact', head: true })
    .eq('soci_responsable_id', soci.id)
    .eq('estat', 'actiu')

  const teGerma = (altresActius ?? 0) > 0

  const { data: configRows } = await serviceSupabase
    .from('configuracio')
    .select('clau, valor')
    .in('clau', ['preu_defecte_jugador', 'descompte_germa_tipus', 'descompte_germa_valor'])
  const cfg: Record<string, string | null> = {}
  for (const r of configRows ?? []) cfg[r.clau] = r.valor

  const preuDefecte = cfg['preu_defecte_jugador'] ? parseInt(cfg['preu_defecte_jugador'], 10) : 30000
  const importBase = teGerma
    ? aplicarDescompteGerma(preuDefecte, cfg['descompte_germa_tipus'], cfg['descompte_germa_valor'])
    : preuDefecte

  const jm = jugador.membres as unknown as { nom: string; cognom1: string; numero_membre: number }
  const equip = jugador.equips as unknown as { nom: string } | null

  // ── Validar cupó (opcional) ───────────────────────────────────
  let stripeCouponId: string | null = null
  let cupoDbId: string | null = null
  const codiCupoNorm = codiCupo.trim().toUpperCase()

  if (codiCupoNorm) {
    const { data: cupo } = await serviceSupabase
      .from('cupons')
      .select('id, actiu, usos_maxims, usos_actuals, stripe_coupon_id, data_expiracio, aplicable_a, equip_id')
      .eq('codi', codiCupoNorm)
      .single()

    if (!cupo) return { error: `El cupó "${codiCupoNorm}" no existeix.` }
    if (!cupo.actiu) return { error: 'Aquest cupó no és actiu.' }
    if (cupo.data_expiracio && new Date(cupo.data_expiracio) < new Date())
      return { error: 'Aquest cupó ha expirat.' }
    if (cupo.usos_maxims !== null && cupo.usos_actuals >= cupo.usos_maxims)
      return { error: 'Aquest cupó ja ha exhaurit els usos disponibles.' }
    if (cupo.aplicable_a === 'soci')
      return { error: 'Aquest cupó no és vàlid per a inscripcions de jugadors.' }
    if (cupo.equip_id && cupo.equip_id !== jugador.equip_id)
      return { error: 'Aquest cupó no és vàlid per a l\'equip d\'aquest jugador.' }

    cupoDbId = cupo.id
    stripeCouponId = cupo.stripe_coupon_id
  }

  const importFinal = metodePagament === 'klarna' ? importAmbKlarna(importBase) : importBase

  const nomProducte = metodePagament === 'klarna'
    ? `Quota futbol base ${jugador.temporada} — ${jm.nom} ${jm.cognom1} (en 3 quotes)`
    : `Quota futbol base ${jugador.temporada} — ${jm.nom} ${jm.cognom1}`

  const paymentMethodTypes: ('card' | 'bizum' | 'klarna')[] =
    metodePagament === 'klarna' ? ['klarna']
    : metodePagament === 'bizum' ? ['bizum']
    : ['card']

  // Crear Stripe Checkout Session
  let checkoutUrl: string
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      locale: 'auto',
      payment_method_types: paymentMethodTypes,
      ...(metodePagament === 'klarna' && { billing_address_collection: 'required' }),
      customer_email: sociMembre?.email ?? undefined,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: nomProducte,
              description: equip?.nom ?? undefined,
            },
            unit_amount: importFinal,
          },
          quantity: 1,
        },
      ],
      metadata: {
        tipus: 'quota_jugador',
        jugador_id: jugadorId,
        soci_responsable_id: soci.id,
        numero_membre: String(jm.numero_membre),
        metode_pagament: metodePagament,
        ...(cupoDbId ? { cupo_id: cupoDbId } : {}),
      },
      ...(stripeCouponId ? { discounts: [{ coupon: stripeCouponId }] } : {}),
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/exit?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/exit?status=cancel`,
    })

    if (!session.url) return { error: 'Error generant l\'enllaç de pagament.' }
    checkoutUrl = session.url
  } catch (err) {
    console.error('[pagarQuota] Stripe error:', err)
    return { error: 'Error connectant amb el servei de pagament. Torna-ho a intentar.' }
  }

  // redirect() fora del try-catch — Next.js llança un error especial que no s'ha de capturar
  redirect(checkoutUrl)
}
