'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const UpdatePasswordSchema = z
  .object({
    password: z.string().min(8, { error: 'Mínim 8 caràcters.' }),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    error: 'Les contrasenyes no coincideixen.',
    path: ['confirm'],
  })

export type UpdatePasswordState =
  | { errors?: { password?: string[]; confirm?: string[] }; error?: string }
  | undefined

export async function updatePasswordAction(
  _prevState: UpdatePasswordState,
  formData: FormData
): Promise<UpdatePasswordState> {
  const parsed = UpdatePasswordSchema.safeParse({
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (error) {
    return { error: 'No s\'ha pogut actualitzar la contrasenya. L\'enllaç pot haver caducat.' }
  }

  redirect('/portal')
}
