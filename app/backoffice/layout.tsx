import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { BackofficeNav } from './_components/backoffice-nav'
import type { GestorInfo } from './_components/backoffice-nav'

export const metadata: Metadata = {
  title: {
    template: '%s — Backoffice Atlètic',
    default: 'Backoffice',
  },
}

export default async function BackofficeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verificar que és gestor (service client per evitar restriccions RLS)
  const serviceSupabase = await createServiceClient()
  const { data: gestor } = await serviceSupabase
    .from('gestors')
    .select('nom, email, rol')
    .eq('user_id', user.id)
    .eq('actiu', true)
    .single()

  if (!gestor) {
    // No és gestor → redirigir al portal de soci
    redirect('/portal')
  }

  const gestorInfo: GestorInfo = {
    nom: gestor.nom,
    email: gestor.email,
    rol: gestor.rol,
  }

  return (
    <div className="min-h-screen bg-background">
      <BackofficeNav gestor={gestorInfo} />
      <div className="pt-14 lg:pt-0 lg:ml-64">
        <main className="p-4 md:p-6 lg:p-8 max-w-6xl">{children}</main>
      </div>
    </div>
  )
}
