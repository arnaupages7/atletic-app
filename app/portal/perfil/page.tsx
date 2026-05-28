import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PerfilForm } from './perfil-form'

export const metadata: Metadata = { title: 'Perfil' }

export default async function PerfilPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Obtenir dades del soci + membre en paral·lel
  const { data: soci } = await supabase
    .from('socis')
    .select('id, dni, adreca, codi_postal, poblacio, provincia, talla_samarreta')
    .eq('user_id', user.id)
    .single()

  if (!soci) redirect('/login')

  const { data: membre } = await supabase
    .from('membres')
    .select('nom, cognom1, cognom2, email, telefon, data_naixement')
    .eq('id', soci.id)
    .single()

  if (!membre) redirect('/login')

  const dades = {
    nom: membre.nom,
    cognom1: membre.cognom1,
    cognom2: membre.cognom2,
    email: membre.email,
    telefon: membre.telefon,
    data_naixement: membre.data_naixement,
    dni: soci.dni,
    adreca: soci.adreca,
    codi_postal: soci.codi_postal,
    poblacio: soci.poblacio,
    provincia: soci.provincia,
    talla_samarreta: soci.talla_samarreta,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Perfil</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Consulta i actualitza les teves dades personals.
        </p>
      </div>

      <PerfilForm dades={dades} />
    </div>
  )
}
