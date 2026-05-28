import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Ruta callback de Supabase Auth.
 * Gestiona:
 *  - Verificació d'email (alta soci)
 *  - Reset de contrasenya (enllaç des de l'email)
 *  - OAuth (si s'afegeix en el futur)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/portal'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Error: redirigir al login amb missatge
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
