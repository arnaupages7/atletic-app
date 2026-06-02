'use server'

import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

const CupoSchema = z.object({
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
})

export type CupoFormState =
  | { error?: string; errors?: Record<string, string[]> }
  | undefined

export async function crearCupoAction(
  _prevState: CupoFormState,
  formData: FormData
): Promise<CupoFormState> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const serviceSupabase = await createServiceClient()
    const { data: gestor } = await serviceSupabase
      .from('gestors')
      .select('id')
      .eq('user_id', user.id)
      .eq('actiu', true)
      .single()
    if (!gestor) return { error: 'No tens permís.' }

    const raw = {
      codi: (formData.get('codi') as string)?.toUpperCase(),
      descripcio: (formData.get('descripcio') as string) || undefined,
      tipus: formData.get('tipus') as string,
      valor: formData.get('valor'),
      usos_maxims: formData.get('usos_maxims') || undefined,
      data_expiracio: (formData.get('data_expiracio') as string) || undefined,
    }

    const parsed = CupoSchema.safeParse(raw)
    if (!parsed.success) {
      return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
    }

    // Comprovar unicitat del codi
    const { count } = await serviceSupabase
      .from('cupons')
      .select('id', { count: 'exact', head: true })
      .eq('codi', parsed.data.codi)
    if ((count ?? 0) > 0) {
      return { errors: { codi: ['Aquest codi ja existeix.'] } }
    }

    // Crear cupó a Stripe
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
      // Continuem sense Stripe (mode dev sense clau live)
    }

    const { error } = await serviceSupabase.from('cupons').insert({
      codi: parsed.data.codi,
      descripcio: parsed.data.descripcio ?? null,
      tipus: parsed.data.tipus,
      valor: parsed.data.valor,
      usos_maxims: typeof parsed.data.usos_maxims === 'number' ? parsed.data.usos_maxims : null,
      data_expiracio: parsed.data.data_expiracio || null,
      stripe_coupon_id: stripeCouponId,
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

export async function toggleCupoAction(cupoId: string, actiu: boolean): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticat.' }

  const serviceSupabase = await createServiceClient()
  const { error } = await serviceSupabase
    .from('cupons')
    .update({ actiu: !actiu })
    .eq('id', cupoId)

  if (error) return { error: 'Error actualitzant el cupó.' }
  return {}
}
