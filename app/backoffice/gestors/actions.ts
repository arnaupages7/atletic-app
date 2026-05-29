'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// ── Toggle actiu/inactiu ──────────────────────────────
export async function toggleActiuGestorAction(
  gestorId: string,
  actiu: boolean
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceSupabase = await createServiceClient()

  // Verificar que qui fa l'acció és admin
  const { data: gestorActual } = await serviceSupabase
    .from('gestors')
    .select('id, rol')
    .eq('user_id', user.id)
    .eq('actiu', true)
    .single()
  if (!gestorActual || gestorActual.rol !== 'admin') {
    return { error: 'Només els administradors poden fer aquesta acció.' }
  }

  // No pot desactivar-se a si mateix
  if (gestorId === gestorActual.id && !actiu) {
    return { error: 'No et pots desactivar a tu mateix.' }
  }

  const { error } = await serviceSupabase
    .from('gestors')
    .update({ actiu })
    .eq('id', gestorId)

  if (error) return { error: 'Error actualitzant l\'estat del gestor.' }

  revalidatePath('/backoffice/gestors')
  return {}
}

// ── Canviar rol ───────────────────────────────────────
export async function canviarRolGestorAction(
  gestorId: string,
  rol: 'admin' | 'gestor'
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceSupabase = await createServiceClient()

  const { data: gestorActual } = await serviceSupabase
    .from('gestors')
    .select('id, rol')
    .eq('user_id', user.id)
    .eq('actiu', true)
    .single()
  if (!gestorActual || gestorActual.rol !== 'admin') {
    return { error: 'Només els administradors poden canviar rols.' }
  }

  if (gestorId === gestorActual.id) {
    return { error: 'No et pots canviar el rol a tu mateix.' }
  }

  const { error } = await serviceSupabase
    .from('gestors')
    .update({ rol })
    .eq('id', gestorId)

  if (error) return { error: 'Error actualitzant el rol.' }

  revalidatePath('/backoffice/gestors')
  return {}
}
