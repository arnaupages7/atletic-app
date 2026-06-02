import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronLeft } from 'lucide-react'
import { EventForm } from '../../_components/event-form'
import { editarEventAction, eliminarEventAction } from './actions'
import { DeleteButton } from './_components/delete-button'

export const metadata: Metadata = { title: 'Editar event' }

export default async function EditarEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data: event } = await supabase
    .from('events')
    .select('id, titol, descripcio, data_inici, data_fi, lloc, imatge_url, embed_url, exclusiu_socis, publicat')
    .eq('id', id)
    .single()

  if (!event) notFound()

  const editarAction = editarEventAction.bind(null, id)
  const eliminarAction = eliminarEventAction.bind(null, id)

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Link
          href="/backoffice/events"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2')}
        >
          <ChevronLeft className="size-4" />
          Events
        </Link>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Editar event</h1>
          <DeleteButton action={eliminarAction} titol={event.titol} />
        </div>
      </div>

      <EventForm
        action={editarAction}
        defaults={{
          titol: event.titol,
          descripcio: event.descripcio,
          data_inici: event.data_inici,
          data_fi: event.data_fi,
          lloc: event.lloc,
          imatge_url: event.imatge_url,
          embed_url: event.embed_url,
          exclusiu_socis: event.exclusiu_socis,
          publicat: event.publicat,
        }}
        submitLabel="Desar canvis"
        pendingLabel="Desant…"
      />
    </div>
  )
}
