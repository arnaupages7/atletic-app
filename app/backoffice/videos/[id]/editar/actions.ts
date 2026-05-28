'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { VideoFormState } from '../../_components/video-form'

const VideoSchema = z.object({
  titol: z.string().min(3, { error: 'El títol ha de tenir mínim 3 caràcters.' }),
  url_youtube: z.string().url({ error: "L'URL no és vàlida." }),
  descripcio: z.string().optional(),
  exclusiu_socis: z.boolean().default(false),
  publicat: z.boolean().default(false),
})

export async function editarVideoAction(
  videoId: string,
  _prevState: VideoFormState,
  formData: FormData
): Promise<VideoFormState> {
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
    url_youtube: formData.get('url_youtube') as string,
    descripcio: (formData.get('descripcio') as string) || undefined,
    exclusiu_socis: formData.get('exclusiu_socis') === 'on',
    publicat: formData.get('publicat') === 'on',
  }

  const parsed = VideoSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const serviceSupabase = await createServiceClient()
  const { error } = await serviceSupabase
    .from('videos')
    .update({
      titol: parsed.data.titol,
      url_youtube: parsed.data.url_youtube,
      descripcio: parsed.data.descripcio ?? null,
      exclusiu_socis: parsed.data.exclusiu_socis,
      publicat: parsed.data.publicat,
      updated_at: new Date().toISOString(),
    })
    .eq('id', videoId)

  if (error) return { error: 'Error desant el vídeo. Torna-ho a intentar.' }

  redirect('/backoffice/videos')
}

export async function eliminarVideoAction(videoId: string): Promise<{ error?: string }> {
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
    .from('videos')
    .delete()
    .eq('id', videoId)

  if (error) return { error: 'Error eliminant el vídeo.' }

  redirect('/backoffice/videos')
}
