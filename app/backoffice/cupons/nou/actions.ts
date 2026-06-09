'use server'

import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

// ── Schema compartit ─────────────────────────────────────────────────────────

const CupoBaseSchema = z.object({
  codi: z
    .string()
    .min(2, { error: 'El codi ha de tenir mínim 2 caràcters.' })
    .max(30, { error: 'El codi no pot superar els 30 caràcters.' })
    .regex(/^[A-Z0-9_-]+$/, { error: 'Només lletres majúscules, números, guions i guions baixos.' })
    .trim(),
  descripcio: z.string().trim().optional(),
  tipus: z.enum(['percentatge', 'import_fix'], { error: 'Selecciona el tipus de descompte.' }),
  valor: z.coerce.number().int().positive({ error: 'El valor ha de ser positiu.' }),
  usos_maxims: z.coerce.number().int().positive().optional().or(z.literal('')),
  data_expiracio: z.string().optional(),
  aplicable_a: z.enum(['soci', 'jugador', 'tots']).default('tots'),
  equip_id: z.string().uuid().optional().or(z.literal('')),
})

const EditarCupoSchema = z.object({
  descripcio: z.string().trim().optional(),
  usos_maxims: z.coerce.number().int().positive().optional().or(z.literal('')),
  data_expiracio: z.string().optional(),
  aplicable_a: z.enum(['soci', 'jugador', 'tots']).default('tots'),
  equip_id: z.string().uuid().optional().or(z.literal('')),
})

export type CupoFormState =
  | { error?: string; errors?: Record<string, string[]> }
  | undefined

// ── Helper d'autorització ────────────────────────────────────────────────────

async function getGestor() {
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

  return { user, gestor, serviceSupabase }
}

// ── Crear cupó ───────────────────────────────────────────────────────────────

export async function crearCupoAction(
  _prevState: CupoFormState,
  formData: FormData
): Promise<CupoFormState> {
  try {
    const { gestor, serviceSupabase } = await getGestor()
    if (!gestor) return { error: 'No tens permís.' }

    const raw = {
      codi: (formData.get('codi') as string)?.toUpperCase(),
      descripcio: (formData.get('descripcio') as string) || undefined,
      tipus: formData.get('tipus') as string,
      valor: formData.get('valor'),
      usos_maxims: formData.get('usos_maxims') || undefined,
      data_expiracio: (formData.get('data_expiracio') as string) || undefined,
      aplicable_a: (formData.get('aplicable_a') as string) || 'tots',
      equip_id: (formData.get('equip_id') as string) || undefined,
    }

    const parsed = CupoBaseSchema.safeParse(raw)
    if (!parsed.success) {
      return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
    }

    // Unicitat del codi
    const { count } = await serviceSupabase
      .from('cupons')
      .select('id', { count: 'exact', head: true })
      .eq('codi', parsed.data.codi)
    if ((count ?? 0) > 0) {
      return { errors: { codi: ['Aquest codi ja existeix.'] } }
    }

    // Crear a Stripe
    let stripeCouponId: string | null = null
    try {
      const couponParams =
        parsed.data.tipus === 'percentatge'
          ? { percent_off: parsed.data.valor, duration: 'once' as const }
          : { amount_off: parsed.data.valor, currency: 'eur', duration: 'once' as const }

      const stripeCoupon = await stripe.coupons.create({
        id: parsed.data.codi,
        name: parsed.data.descripcio ?? parsed.data.codi,
        ...couponParams,
      })
      stripeCouponId = stripeCoupon.id
    } catch (stripeErr) {
      console.error('[crearCupo] Stripe error:', stripeErr)
    }

    const equipId =
      parsed.data.aplicable_a === 'jugador' && parsed.data.equip_id
        ? parsed.data.equip_id
        : null

    const { error } = await serviceSupabase.from('cupons').insert({
      codi: parsed.data.codi,
      descripcio: parsed.data.descripcio ?? null,
      tipus: parsed.data.tipus,
      valor: parsed.data.valor,
      usos_maxims: typeof parsed.data.usos_maxims === 'number' ? parsed.data.usos_maxims : null,
      data_expiracio: parsed.data.data_expiracio || null,
      stripe_coupon_id: stripeCouponId,
      aplicable_a: parsed.data.aplicable_a,
      equip_id: equipId,
      actiu: true,
    })

    if (error) {
      console.error('[crearCupo] DB error:', error)
      return { error: 'Error desant el cupó.' }
    }

    redirect('/backoffice/cupons')
  } catch (err: unknown) {
    if (isRedirectError(err)) throw err
    console.error('[crearCupoAction]', err)
    return { error: 'Error inesperat.' }
  }
}

// ── Editar cupó ──────────────────────────────────────────────────────────────

export async function editarCupoAction(
  cupoId: string,
  _prevState: CupoFormState,
  formData: FormData
): Promise<CupoFormState> {
  try {
    const { gestor, serviceSupabase } = await getGestor()
    if (!gestor) return { error: 'No tens permís.' }

    const raw = {
      descripcio: (formData.get('descripcio') as string) || undefined,
      usos_maxims: formData.get('usos_maxims') || undefined,
      data_expiracio: (formData.get('data_expiracio') as string) || undefined,
      aplicable_a: (formData.get('aplicable_a') as string) || 'tots',
      equip_id: (formData.get('equip_id') as string) || undefined,
    }

    const parsed = EditarCupoSchema.safeParse(raw)
    if (!parsed.success) {
      return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
    }

    // Obtenir stripe_coupon_id per actualitzar el nom
    const { data: cupo } = await serviceSupabase
      .from('cupons')
      .select('stripe_coupon_id')
      .eq('id', cupoId)
      .single()

    if (!cupo) return { error: 'Cupó no trobat.' }

    // Actualitzar nom a Stripe si ha canviat la descripció
    if (cupo.stripe_coupon_id && parsed.data.descripcio !== undefined) {
      try {
        await stripe.coupons.update(cupo.stripe_coupon_id, {
          name: parsed.data.descripcio || undefined,
        })
      } catch (stripeErr) {
        console.error('[editarCupo] Stripe update error:', stripeErr)
      }
    }

    const equipId =
      parsed.data.aplicable_a === 'jugador' && parsed.data.equip_id
        ? parsed.data.equip_id
        : null

    const { error } = await serviceSupabase
      .from('cupons')
      .update({
        descripcio: parsed.data.descripcio ?? null,
        usos_maxims: typeof parsed.data.usos_maxims === 'number' ? parsed.data.usos_maxims : null,
        data_expiracio: parsed.data.data_expiracio || null,
        aplicable_a: parsed.data.aplicable_a,
        equip_id: equipId,
      })
      .eq('id', cupoId)

    if (error) return { error: 'Error actualitzant el cupó.' }

    redirect('/backoffice/cupons')
  } catch (err: unknown) {
    if (isRedirectError(err)) throw err
    console.error('[editarCupoAction]', err)
    return { error: 'Error inesperat.' }
  }
}

// ── Eliminar cupó ────────────────────────────────────────────────────────────

export async function eliminarCupoAction(cupoId: string): Promise<{ error?: string }> {
  const { gestor, serviceSupabase } = await getGestor()
  if (!gestor) return { error: 'No tens permís.' }

  const { data: cupo } = await serviceSupabase
    .from('cupons')
    .select('stripe_coupon_id, usos_actuals')
    .eq('id', cupoId)
    .single()

  if (!cupo) return { error: 'Cupó no trobat.' }

  // Eliminar a Stripe (no bloquejant)
  if (cupo.stripe_coupon_id) {
    try {
      await stripe.coupons.del(cupo.stripe_coupon_id)
    } catch (stripeErr) {
      console.error('[eliminarCupo] Stripe delete error:', stripeErr)
    }
  }

  const { error } = await serviceSupabase.from('cupons').delete().eq('id', cupoId)
  if (error) return { error: 'Error eliminant el cupó.' }

  return {}
}

// ── Activar / desactivar ─────────────────────────────────────────────────────

export async function toggleCupoAction(cupoId: string, actiu: boolean): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticat.' }

  const serviceSupabase = await createServiceClient()
  const { error } = await serviceSupabase
    .from('cupons')
    .update({ actiu: !actiu })
    .eq('id', cupoId)

  if (error) return { error: 'Error actualitzant el cupó.' }
  return {}
}
