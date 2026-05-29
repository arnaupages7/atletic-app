'use server'

import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { importAmbKlarna } from '@/lib/klarna'

export async function pagarQuotaJugadorAction(
  jugadorId: string,
  metodePagament: 'card' | 'klarna' = 'card'
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
  const importBase = teGerma ? 27500 : 30000

  const jm = jugador.membres as unknown as { nom: string; cognom1: string; numero_membre: number }
  const equip = jugador.equips as unknown as { nom: string } | null

  const importFinal = metodePagament === 'klarna' ? importAmbKlarna(importBase) : importBase

  const nomProducte = metodePagament === 'klarna'
    ? `Quota futbol base ${jugador.temporada} — ${jm.nom} ${jm.cognom1} (en 3 quotes)`
    : `Quota futbol base ${jugador.temporada} — ${jm.nom} ${jm.cognom1}`

  // Crear Stripe Checkout Session
  let checkoutUrl: string
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      locale: 'auto',
      payment_method_types: metodePagament === 'klarna' ? ['klarna'] : ['card'],
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
      },
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
