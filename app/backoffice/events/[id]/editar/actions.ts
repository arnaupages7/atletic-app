'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { EventFormState } from '../../_components/event-form'

const EventSchema = z.object({
  titol: z.string().min(3, { error: 'El títol ha de tenir mínim 3 caràcters.' }),
  descripcio: z.string().optional(),
  data_inici: z.string().min(1, { error: "La data d'inici és obligatòria." }),
  data_fi: z.string().optional(),
  lloc: z.string().optional(),
  exclusiu_socis: z.boolean().default(false),
  publicat: z.boolean().default(false),
})

export async function editarEventAction(
  eventId: string,
  _prevState: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: gestor } = await supabase
    .from('gestors')
    .select('id')
    .eq('user_id', user.id)
    .eq('actiu', true)
    .single()
  if (!gestor) return { error: 'No tens permís per fer aquesta acció.' }

  const raw = {
    titol: formData.get('titol') as string,
    descripcio: (formData.get('descripcio') as string) || undefined,
    data_inici: formData.get('data_inici') as string,
    data_fi: (formData.get('data_fi') as string) || undefined,
    lloc: (formData.get('lloc') as string) || undefined,
    exclusiu_socis: formData.get('exclusiu_socis') === 'on',
    publicat: formData.get('publicat') === 'on',
  }

  const parsed = EventSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const serviceSupabase = await createServiceClient()
  const { error } = await serviceSupabase
    .from('events')
    .update({
      titol: parsed.data.titol,
      descripcio: parsed.data.descripcio ?? null,
      data_inici: parsed.data.data_inici,
      data_fi: parsed.data.data_fi ?? null,
      lloc: parsed.data.lloc ?? null,
      exclusiu_socis: parsed.data.exclusiu_socis,
      publicat: parsed.data.publicat,
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId)

  if (error) return { error: "Error desant l'event. Torna-ho a intentar." }

  redirect('/backoffice/events')
}

export async function eliminarEventAction(eventId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: gestor } = await supabase
    .from('gestors')
    .select('id')
    .eq('user_id', user.id)
    .eq('actiu', true)
    .single()
  if (!gestor) return { error: 'No tens permís per fer aquesta acció.' }

  const serviceSupabase = await createServiceClient()
  const { error } = await serviceSupabase
    .from('events')
    .delete()
    .eq('id', eventId)

  if (error) return { error: "Error eliminant l'event." }

  redirect('/backoffice/events')
}
