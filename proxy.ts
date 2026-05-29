import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rutes que requereixen autenticació
const RUTES_PORTAL = ['/portal']
const RUTES_BACKOFFICE = ['/backoffice']

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Rutes del portal: requereix usuari autenticat
  const esRutaPortal = RUTES_PORTAL.some((r) => pathname.startsWith(r))
  if (esRutaPortal && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Rutes del backoffice: requereix autenticació (rol comprovat a la pàgina)
  const esRutaBackoffice = RUTES_BACKOFFICE.some((r) => pathname.startsWith(r))
  if (esRutaBackoffice && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirigir usuaris autenticats fora de les pàgines d'auth
  // /registre: permetre accés si l'usuari autenticat no té soci (cas excepcional)
  if (user && pathname === '/login') {
    const { data: gestor } = await supabase
      .from('gestors')
      .select('id')
      .eq('user_id', user.id)
      .eq('actiu', true)
      .maybeSingle()
    return NextResponse.redirect(new URL(gestor ? '/backoffice' : '/portal', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
