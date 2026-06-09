'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { stripe } from '@/lib/stripe'
import { enviarEmail } from '@/lib/email'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { aplicarDescompteGerma, formatDescompteGerma } from '@/lib/descompte-germa'

// ── Aprovar jugador ──────────────────────────────────────────
export async function aprovarJugadorAction(jugadorId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceSupabase = await createServiceClient()

  // Verificar gestor
  const { data: gestor } = await serviceSupabase
    .from('gestors')
    .select('id')
    .eq('user_id', user.id)
    .eq('actiu', true)
    .single()
  if (!gestor) return { error: 'No tens permís per fer aquesta acció.' }

  // Obtenir jugador + membre + soci responsable + equip
  const { data: jugador } = await serviceSupabase
    .from('jugadors')
    .select(`
      id,
      estat,
      soci_responsable_id,
      temporada,
      equip_id,
      membres!inner(nom, cognom1, numero_membre),
      equips(nom, preu_inscripcio, soci_automatic)
    `)
    .eq('id', jugadorId)
    .single()

  if (!jugador) return { error: 'Jugador no trobat.' }

  if (jugador.estat !== 'pendent_aprovacio') {
    return { error: 'Aquesta sol·licitud ja ha estat processada.' }
  }

  // Obtenir dades soci (email + nom)
  const { data: sociMembre } = await serviceSupabase
    .from('membres')
    .select('nom, cognom1, email')
    .eq('id', jugador.soci_responsable_id)
    .single()

  const jm = jugador.membres as unknown as { nom: string; cognom1: string; numero_membre: number }
  const equip = jugador.equips as unknown as { nom: string; preu_inscripcio: number | null; soci_automatic: boolean } | null

  // ── Soci automàtic: aprovar i activar sense pagament ──────
  if (equip?.soci_automatic) {
    const { error: updateError } = await serviceSupabase
      .from('jugadors')
      .update({ estat: 'actiu' })
      .eq('id', jugadorId)

    if (updateError) return { error: "Error actualitzant l'estat." }

    // Email sense link de pagament
    try {
      await enviarEmail({
        templateId: 'inscripcio_aprovada',
        to: sociMembre?.email ?? '',
        variables: {
          nom: sociMembre?.nom ?? '',
          nom_jugador: `${jm.nom} ${jm.cognom1}`,
          equip: equip?.nom ?? '',
          temporada: jugador.temporada,
          import: 'Gratuït (primer equip)',
          url_pagament: '',
        },
      })
    } catch {
      // Email no és bloquejant
    }

    return {}
  }

  // ── Flux normal: pagament requerit ──────────────────────────

  // Descompte germà (té un altre jugador actiu?)
  const { count: altresActius } = await serviceSupabase
    .from('jugadors')
    .select('id', { count: 'exact', head: true })
    .eq('soci_responsable_id', jugador.soci_responsable_id)
    .eq('estat', 'actiu')

  const teGerma = (altresActius ?? 0) > 0

  // Configuració de preus i descompte germà
  const { data: configRows } = await serviceSupabase
    .from('configuracio')
    .select('clau, valor')
    .in('clau', ['preu_defecte_jugador', 'descompte_germa_tipus', 'descompte_germa_valor'])
  const cfg: Record<string, string | null> = {}
  for (const r of configRows ?? []) cfg[r.clau] = r.valor

  const preuDefecte = cfg['preu_defecte_jugador'] ? parseInt(cfg['preu_defecte_jugador'], 10) : 30000

  // Preu: configurat per equip > preu per defecte (amb possible descompte germà)
  let importCents: number
  if (equip?.preu_inscripcio != null) {
    importCents = equip.preu_inscripcio
  } else if (teGerma) {
    importCents = aplicarDescompteGerma(preuDefecte, cfg['descompte_germa_tipus'], cfg['descompte_germa_valor'])
  } else {
    importCents = preuDefecte
  }

  const descText = formatDescompteGerma(cfg['descompte_germa_tipus'], cfg['descompte_germa_valor'])
  const importText = teGerma && equip?.preu_inscripcio == null
    ? `${(importCents / 100).toFixed(0)} € (descompte germà −${descText} aplicat)`
    : `${(importCents / 100).toFixed(0)} €`

  // Actualitzar estat jugador a 'aprovada'
  const { error: updateError } = await serviceSupabase
    .from('jugadors')
    .update({ estat: 'aprovada' })
    .eq('id', jugadorId)

  if (updateError) return { error: "Error actualitzant l'estat. Torna-ho a intentar." }

  // Crear Stripe Checkout
  let checkoutUrl: string | null = null
  try {
    if (
      process.env.STRIPE_SECRET_KEY &&
      !process.env.STRIPE_SECRET_KEY.includes('PENDENT')
    ) {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: sociMembre?.email ?? undefined,
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Quota futbol base ${jugador.temporada} — ${jm.nom} ${jm.cognom1}`,
                description: equip?.nom ?? undefined,
              },
              unit_amount: importCents,
            },
            quantity: 1,
          },
        ],
        metadata: {
          jugador_id: jugadorId,
          soci_responsable_id: jugador.soci_responsable_id,
          numero_membre: String(jm.numero_membre),
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/exit?status=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/exit?status=cancel`,
      })
      checkoutUrl = session.url
    }
  } catch (stripeErr) {
    console.error('aprovar: error Stripe', stripeErr)
  }

  // Email al soci
  try {
    await enviarEmail({
      templateId: 'inscripcio_aprovada',
      to: sociMembre?.email ?? '',
      variables: {
        nom: sociMembre?.nom ?? '',
        nom_jugador: `${jm.nom} ${jm.cognom1}`,
        equip: equip?.nom ?? '',
        temporada: jugador.temporada,
        import: importText,
        url_pagament: checkoutUrl ?? '',
      },
    })
  } catch (emailErr) {
    console.error('aprovar: error email', emailErr)
  }

  return {}
}

// ── Canviar equip ────────────────────────────────────────────
export type CanviEquipState = { error?: string; ok?: boolean } | undefined

export async function canviarEquipAction(
  jugadorId: string,
  _prevState: CanviEquipState,
  formData: FormData
): Promise<CanviEquipState> {
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
  if (!gestor) return { error: 'No tens permís per fer aquesta acció.' }

  const nouEquipId = (formData.get('equip_id') as string | null)?.trim()
  if (!nouEquipId) return { error: "Selecciona un equip." }

  const { error: updateError } = await serviceSupabase
    .from('jugadors')
    .update({ equip_id: nouEquipId })
    .eq('id', jugadorId)

  if (updateError) return { error: "Error actualitzant l'equip. Torna-ho a intentar." }

  return { ok: true }
}

// ── Denegar jugador ──────────────────────────────────────────
const DenegarSchema = z.object({
  motiu: z.string().min(5, { error: 'El motiu ha de tenir mínim 5 caràcters.' }),
})

export type DenegarState = { error?: string; errors?: Record<string, string[]> } | undefined

export async function denegarJugadorAction(
  jugadorId: string,
  _prevState: DenegarState,
  formData: FormData
): Promise<DenegarState> {
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

  const parsed = DenegarSchema.safeParse({ motiu: formData.get('motiu') })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  // Obtenir jugador + soci
  const { data: jugador } = await serviceSupabase
    .from('jugadors')
    .select(`
      id,
      soci_responsable_id,
      membres!inner(nom, cognom1),
      equips(nom)
    `)
    .eq('id', jugadorId)
    .single()

  if (!jugador) return { error: 'Jugador no trobat.' }

  const { data: sociMembre } = await serviceSupabase
    .from('membres')
    .select('nom, email')
    .eq('id', jugador.soci_responsable_id)
    .single()

  // Actualitzar estat
  const { error: updateError } = await serviceSupabase
    .from('jugadors')
    .update({ estat: 'denegada', motiu_denegacio: parsed.data.motiu })
    .eq('id', jugadorId)

  if (updateError) return { error: "Error actualitzant l'estat." }

  const jm = jugador.membres as unknown as { nom: string; cognom1: string }
  const equip = jugador.equips as unknown as { nom: string } | null

  // Email al soci
  try {
    await enviarEmail({
      templateId: 'inscripcio_denegada',
      to: sociMembre?.email ?? '',
      variables: {
        nom: sociMembre?.nom ?? '',
        nom_jugador: `${jm.nom} ${jm.cognom1}`,
        equip: equip?.nom ?? '',
        motiu: parsed.data.motiu,
      },
    })
  } catch (emailErr) {
    console.error('denegar: error email', emailErr)
  }

  redirect('/backoffice/jugadors?tab=pendent_aprovacio')
}
