'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.email({ error: 'Adreça de correu no vàlida.' }),
  password: z.string().min(1, { error: 'La contrasenya és obligatòria.' }),
})

export type LoginState =
  | { error: string; field?: 'email' | 'password' }
  | undefined

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = LoginSchema.safeParse(raw)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return {
      error: firstIssue.message,
      field: firstIssue.path[0] as 'email' | 'password',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    // No revelar si l'email existeix o no (seguretat)
    return { error: 'Correu electrònic o contrasenya incorrectes.' }
  }

  redirect('/portal')
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
