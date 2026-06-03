import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { EditarJugadorForm } from './_components/editar-jugador-form'

export const metadata: Metadata = { title: 'Editar jugador' }

export default async function EditarJugadorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceSupabase = await createServiceClient()

  // Verificar que és soci responsable d'aquest jugador
  const { data: soci } = await serviceSupabase
    .from('socis')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!soci) redirect('/login')

  const { data: jugador } = await serviceSupabase
    .from('jugadors')
    .select('id, soci_responsable_id, estat, genere, talla_samarreta, adreca, num_catsalut, consentiment_comunicacions, equip_id')
    .eq('id', id)
    .single()

  if (!jugador || jugador.soci_responsable_id !== soci.id) notFound()

  // telefon és a membres
  const { data: membre } = await serviceSupabase
    .from('membres')
    .select('nom, cognom1, cognom2, data_naixement, telefon')
    .eq('id', id)
    .single()

  if (!membre) notFound()

  const { data: equip } = jugador.equip_id
    ? await serviceSupabase
        .from('equips')
        .select('nom')
        .eq('id', jugador.equip_id)
        .single()
    : { data: null }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Editar jugador</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {membre.nom} {membre.cognom1}
          {equip ? ` · ${equip.nom}` : ''}
        </p>
      </div>

      <EditarJugadorForm
        jugadorId={id}
        defaults={{
          nom: membre.nom,
          cognom1: membre.cognom1,
          cognom2: membre.cognom2 ?? '',
          data_naixement: membre.data_naixement ?? '',
          genere: (jugador.genere as 'M' | 'F' | 'A' | null) ?? undefined,
          talla_samarreta: (jugador.talla_samarreta ?? 'M') as 'Miss' | 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL',
          adreca: jugador.adreca ?? '',
          telefon: membre.telefon ?? '',
          num_catsalut: jugador.num_catsalut ?? '',
          consentiment_comunicacions: jugador.consentiment_comunicacions ?? false,
        }}
      />
    </div>
  )
}
