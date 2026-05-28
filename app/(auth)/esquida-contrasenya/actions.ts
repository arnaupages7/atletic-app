'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ForgotSchema = z.object({
  email: z.email({ error: 'Adreça de correu no vàlida.' }),
})

export type ForgotState =
  | { success?: boolean; error?: string }
  | undefined

export async function forgotPasswordAction(
  _prevState: ForgotState,
  formData: FormData
): Promise<ForgotState> {
  const parsed = ForgotSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/actualitzar-contrasenya`,
    }
  )

  if (error) {
    return { error: 'No s\'ha pogut enviar el correu. Torna-ho a intentar.' }
  }

  // Sempre retornem success (no revelar si l'email existeix)
  return { success: true }
}
