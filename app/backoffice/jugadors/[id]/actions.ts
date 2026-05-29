'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { Resend } from 'resend'
import { stripe } from '@/lib/stripe'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// ── Aprovar jugador ──────────────────────────────────────────
export async function aprovarJugadorAction(jugadorId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verificar gestor
  const { data: gestor } = await (await createServiceClient())
    .from('gestors')
    .select('id')
    .eq('user_id', user.id)
    .eq('actiu', true)
    .single()
  if (!gestor) return { error: 'No tens permís per fer aquesta acció.' }

  const serviceSupabase = await createServiceClient()

  // Obtenir jugador + membre + soci responsable + membre del soci
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

  // Detectar descompte germà (¿té un altre jugador actiu?)
  const { count: altresActius } = await serviceSupabase
    .from('jugadors')
    .select('id', { count: 'exact', head: true })
    .eq('soci_responsable_id', jugador.soci_responsable_id)
    .eq('estat', 'actiu')

  const teGerma = (altresActius ?? 0) > 0
  const importCents = teGerma ? 27500 : 30000 // 275€ o 300€

  const jm = jugador.membres as unknown as { nom: string; cognom1: string; numero_membre: number }
  const equip = jugador.equips as unknown as { nom: string } | null

  // Actualitzar estat jugador a 'aprovada'
  const { error: updateError } = await supabase
    .from('jugadors')
    .update({ estat: 'aprovada' })
    .eq('id', jugadorId)

  if (updateError) return { error: 'Error actualitzant l\'estat. Torna-ho a intentar.' }

  // Crear Stripe Checkout (si Stripe configurat)
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
    // No bloquejem — enviem email sense link de pagament
  }

  // Email al soci
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: `Atlètic Club Banyoles <${process.env.RESEND_FROM_EMAIL ?? 'administracio@atletic.cat'}>`,
      to: sociMembre?.email ?? 'administracio@atletic.cat',
      subject: `Inscripció aprovada — ${jm.nom} ${jm.cognom1}`,
      html: `
        <h2>La inscripció ha estat aprovada</h2>
        <p>Hola ${sociMembre?.nom ?? ''},</p>
        <p>La sol·licitud d'inscripció de <strong>${jm.nom} ${jm.cognom1}</strong>
        a l'equip <strong>${equip?.nom ?? ''}</strong> (temporada ${jugador.temporada}) ha estat <strong>aprovada</strong>.</p>

        <p>Import de la quota: <strong>${teGerma ? '275 €' : '300 €'}${teGerma ? ' (descompte germà aplicat)' : ''}</strong></p>

        ${checkoutUrl
          ? `<p style="margin:24px 0"><a href="${checkoutUrl}" style="background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">Pagar la quota ara</a></p>`
          : `<p>El club et farà arribar l'enllaç de pagament en breu.</p>`
        }

        <p style="color:#888;font-size:12px;margin-top:32px">Atlètic Club Banyoles — portal.atletic.cat</p>
      `,
    })
  } catch (emailErr) {
    console.error('aprovar: error email', emailErr)
  }

  return {}
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

  const { data: gestor } = await (await createServiceClient())
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

  const serviceSupabase = await createServiceClient()

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
  const { error: updateError } = await supabase
    .from('jugadors')
    .update({ estat: 'denegada', motiu_denegacio: parsed.data.motiu })
    .eq('id', jugadorId)

  if (updateError) return { error: 'Error actualitzant l\'estat.' }

  const jm = jugador.membres as unknown as { nom: string; cognom1: string }
  const equip = jugador.equips as unknown as { nom: string } | null

  // Email al soci
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: `Atlètic Club Banyoles <${process.env.RESEND_FROM_EMAIL ?? 'administracio@atletic.cat'}>`,
      to: sociMembre?.email ?? 'administracio@atletic.cat',
      subject: `Sol·licitud denegada — ${jm.nom} ${jm.cognom1}`,
      html: `
        <h2>Sol·licitud d'inscripció no acceptada</h2>
        <p>Hola ${sociMembre?.nom ?? ''},</p>
        <p>La sol·licitud d'inscripció de <strong>${jm.nom} ${jm.cognom1}</strong>
        a l'equip <strong>${equip?.nom ?? ''}</strong> ha estat <strong>denegada</strong>.</p>
        <p><strong>Motiu:</strong> ${parsed.data.motiu}</p>
        <p>Si tens dubtes, posa't en contacte amb el club a <a href="mailto:administracio@atletic.cat">administracio@atletic.cat</a>.</p>
        <p style="color:#888;font-size:12px;margin-top:32px">Atlètic Club Banyoles — portal.atletic.cat</p>
      `,
    })
  } catch (emailErr) {
    console.error('denegar: error email', emailErr)
  }

  redirect('/backoffice/jugadors?tab=pendent_aprovacio')
}
