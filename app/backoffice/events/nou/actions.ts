'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { enviarEmailMassiu } from '@/lib/email'
import type { EventFormState } from '../_components/event-form'

const EventSchema = z.object({
  titol: z.string().min(3, { error: 'El títol ha de tenir mínim 3 caràcters.' }),
  descripcio: z.string().optional(),
  data_inici: z.string().min(1, { error: "La data d'inici és obligatòria." }),
  data_fi: z.string().optional(),
  lloc: z.string().optional(),
  imatge_url: z.string().optional(),
  embed_url: z.string().optional(),
  exclusiu_socis: z.boolean().default(false),
  publicat: z.boolean().default(false),
})

export async function crearEventAction(
  _prevState: EventFormState,
  formData: FormData
): Promise<EventFormState> {
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

  const raw = {
    titol: formData.get('titol') as string,
    descripcio: (formData.get('descripcio') as string) || undefined,
    data_inici: formData.get('data_inici') as string,
    data_fi: (formData.get('data_fi') as string) || undefined,
    lloc: (formData.get('lloc') as string) || undefined,
    imatge_url: (formData.get('imatge_url') as string) || undefined,
    embed_url: (formData.get('embed_url') as string) || undefined,
    exclusiu_socis: formData.get('exclusiu_socis') === 'on',
    publicat: formData.get('publicat') === 'on',
  }

  const parsed = EventSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const { data: newEvent, error } = await serviceSupabase
    .from('events')
    .insert({
      titol: parsed.data.titol,
      descripcio: parsed.data.descripcio ?? null,
      data_inici: parsed.data.data_inici,
      data_fi: parsed.data.data_fi ?? null,
      lloc: parsed.data.lloc ?? null,
      imatge_url: parsed.data.imatge_url ?? null,
      embed_url: parsed.data.embed_url ?? null,
      exclusiu_socis: parsed.data.exclusiu_socis,
      publicat: parsed.data.publicat,
      notificacio_enviada: false,
      autor_id: gestor.id,
    })
    .select('id, titol, data_inici, lloc, notificacio_enviada, publicat')
    .single()

  if (error || !newEvent) return { error: "Error creant l'event. Torna-ho a intentar." }

  // Enviar email massiu si publicat
  if (newEvent.publicat && !newEvent.notificacio_enviada) {
    await enviarNotificacioEvent(serviceSupabase, newEvent)
    await serviceSupabase
      .from('events')
      .update({ notificacio_enviada: true })
      .eq('id', newEvent.id)
  }

  redirect('/backoffice/events')
}

// ── Funció compartida per enviar notificació d'event ─────────────────────────
export async function enviarNotificacioEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  event: { id: string; titol: string; data_inici: string; lloc: string | null }
) {
  try {
    // Tots els socis actius amb consentiment de comunicacions
    const { data: socis } = await supabase
      .from('socis')
      .select('id, membres!inner(nom, email)')
      .eq('estat', 'actiu')
      .eq('consentiment_comunicacions', true)

    if (!socis || socis.length === 0) return

    const destinataris = socis
      .map((s: { membres: { nom: string; email: string | null } }) => ({
        nom: s.membres.nom,
        email: s.membres.email,
      }))
      .filter((d: { email: string | null }) => !!d.email)
      .map((d: { nom: string; email: string }) => ({
        email: d.email,
        variablesPersonals: { nom: d.nom },
      }))

    const dataEvent = new Intl.DateTimeFormat('ca-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(event.data_inici))

    await enviarEmailMassiu({
      templateId: 'nou_event',
      destinataris,
      variablesComunes: {
        titol_event: event.titol,
        data_event: dataEvent,
        lloc: event.lloc ? `Lloc: ${event.lloc}` : '',
        url_events: `${process.env.NEXT_PUBLIC_APP_URL}/portal/events`,
      },
    })
  } catch (err) {
    console.error('[event] Error enviant notificació:', err)
  }
}
