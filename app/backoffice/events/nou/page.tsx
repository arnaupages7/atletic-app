import type { Metadata } from 'next'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronLeft } from 'lucide-react'
import { EventForm } from '../_components/event-form'
import { crearEventAction } from './actions'

export const metadata: Metadata = { title: 'Nou event' }

export default function NouEventPage() {
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
        <h1 className="text-2xl font-semibold tracking-tight">Nou event</h1>
      </div>

      <EventForm
        action={crearEventAction}
        submitLabel="Crear event"
        pendingLabel="Creant…"
      />
    </div>
  )
}
