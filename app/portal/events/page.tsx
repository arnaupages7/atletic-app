import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, MapPin, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Events' }

function formatData(isoString: string): string {
  return new Intl.DateTimeFormat('ca-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(isoString))
}

function formatHora(isoString: string): string {
  return new Intl.DateTimeFormat('ca-ES', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoString))
}

function isEventPast(dataFi: string | null, dataInici: string): boolean {
  const ref = dataFi ?? dataInici
  return new Date(ref) < new Date()
}

export default async function EventsPage() {
  const supabase = await createClient()

  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('publicat', true)
    .order('data_inici', { ascending: true })

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
        <p className="text-muted-foreground text-sm">
          No s&apos;han pogut carregar els events. Torna-ho a intentar.
        </p>
      </div>
    )
  }

  // Separar propers i passats
  const propers = events?.filter((e) => !isEventPast(e.data_fi, e.data_inici)) ?? []
  const passats = events?.filter((e) => isEventPast(e.data_fi, e.data_inici)) ?? []

  return (
    <div className="space-y-8">
      {/* Capçalera */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Activitats i actes del club. Els marcats amb{' '}
          <Lock className="inline size-3.5 text-muted-foreground" /> són exclusius per a socis.
        </p>
      </div>

      {/* Sense events */}
      {(!events || events.length === 0) && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <CalendarDays className="size-8 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No hi ha cap event publicat de moment.</p>
        </div>
      )}

      {/* Propers events */}
      {propers.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Propers events
          </h2>
          <div className="space-y-3">
            {propers.map((event) => (
              <Card key={event.id} className={cn(
                'transition-colors',
                event.exclusiu_socis && 'border-primary/20'
              )}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-start gap-2 text-base font-semibold">
                    <span className="flex-1">{event.titol}</span>
                    {event.exclusiu_socis && (
                      <Lock className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {event.descripcio && (
                    <p className="text-sm text-muted-foreground">{event.descripcio}</p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="size-3.5 shrink-0" />
                      <span>
                        {formatData(event.data_inici)}
                        {' '}a les {formatHora(event.data_inici)}
                        {event.data_fi && ` — ${formatHora(event.data_fi)}`}
                      </span>
                    </div>
                    {event.lloc && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="size-3.5 shrink-0" />
                        <span>{event.lloc}</span>
                      </div>
                    )}
                  </div>
                  {event.exclusiu_socis && (
                    <p className="text-xs font-medium text-primary/70">
                      Exclusiu per a socis
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Events passats */}
      {passats.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Events passats
          </h2>
          <div className="space-y-3">
            {passats.map((event) => (
              <Card key={event.id} className="opacity-60">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-start gap-2 text-base font-semibold">
                    <span className="flex-1">{event.titol}</span>
                    {event.exclusiu_socis && (
                      <Lock className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="size-3.5 shrink-0" />
                      <span>{formatData(event.data_inici)}</span>
                    </div>
                    {event.lloc && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="size-3.5 shrink-0" />
                        <span>{event.lloc}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
