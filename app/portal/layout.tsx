import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NavSidebar } from './_components/nav-sidebar'
import type { SociInfo } from './_components/nav-sidebar'

export const metadata: Metadata = {
  title: {
    template: '%s — Portal Atlètic',
    default: 'Portal del soci',
  },
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Obtenir dades del soci (id + estat)
  const { data: soci } = await supabase
    .from('socis')
    .select('id, estat')
    .eq('user_id', user.id)
    .single()

  if (!soci) redirect('/login')

  // Obtenir dades del membre (nom + número)
  const { data: membre } = await supabase
    .from('membres')
    .select('nom, cognom1, numero_membre')
    .eq('id', soci.id)
    .single()

  if (!membre) redirect('/login')

  const sociInfo: SociInfo = {
    id: soci.id,
    estat: soci.estat,
    nom: membre.nom,
    cognom1: membre.cognom1,
    numero_membre: membre.numero_membre,
  }

  return (
    <div className="min-h-screen bg-background">
      <NavSidebar soci={sociInfo} />

      {/* Content area:
          mobile  → below the fixed header (pt-14)
          desktop → beside the sidebar (ml-64, no pt) */}
      <div className="pt-14 lg:pt-0 lg:ml-64">
        <main className="p-4 md:p-6 lg:p-8 max-w-5xl">{children}</main>
      </div>
    </div>
  )
}
