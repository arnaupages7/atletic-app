'use server'

import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { enviarEmail } from '@/lib/email'

export async function reenviarBenvingudaAction(
  sociId: string
): Promise<{ ok?: boolean; error?: string }> {
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

  const { data: membre } = await serviceSupabase
    .from('membres')
    .select('nom, email')
    .eq('id', sociId)
    .single()

  if (!membre?.email) return { error: 'Aquest soci no té correu registrat.' }

  try {
    await enviarEmail({
      templateId: 'confirmacio_registre',
      to: membre.email,
      variables: {
        nom: membre.nom,
        email: membre.email,
        url_portal: `${process.env.NEXT_PUBLIC_APP_URL}/portal`,
      },
    })
  } catch {
    return { error: 'Error enviant el correu.' }
  }

  return { ok: true }
}
