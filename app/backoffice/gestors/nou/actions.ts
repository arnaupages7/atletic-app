'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const NouGestorSchema = z.object({
  nom: z.string().min(2, { error: 'El nom ha de tenir mínim 2 caràcters.' }),
  email: z.string().email({ error: "L'email no és vàlid." }),
  password: z.string().min(8, { error: 'La contrasenya ha de tenir mínim 8 caràcters.' }),
  rol: z.enum(['admin', 'gestor'], { error: 'Rol no vàlid.' }),
})

export type NouGestorState = {
  error?: string
  errors?: Record<string, string[]>
} | undefined

export async function crearGestorAction(
  _prevState: NouGestorState,
  formData: FormData
): Promise<NouGestorState> {
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
    return { error: 'Només els administradors poden crear gestors.' }
  }

  const parsed = NouGestorSchema.safeParse({
    nom: formData.get('nom'),
    email: formData.get('email'),
    password: formData.get('password'),
    rol: formData.get('rol'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const { nom, email, password, rol } = parsed.data

  // Crear usuari Auth
  const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    if (authError.message.toLowerCase().includes('already registered')) {
      return { errors: { email: ['Aquest correu ja està registrat.'] } }
    }
    return { error: 'Error creant el compte. Torna-ho a intentar.' }
  }

  // Crear registre gestor
  const { error: gestorError } = await serviceSupabase
    .from('gestors')
    .insert({
      user_id: authData.user.id,
      nom,
      email,
      rol,
      actiu: true,
    })

  if (gestorError) {
    // Rollback: eliminar usuari auth
    await serviceSupabase.auth.admin.deleteUser(authData.user.id)
    return { error: 'Error creant el gestor. Torna-ho a intentar.' }
  }

  redirect('/backoffice/gestors')
}
