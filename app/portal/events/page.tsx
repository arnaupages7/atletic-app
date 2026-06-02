import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, MapPin, CalendarDays, Video } from 'lucide-react'
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

/** Normalitza URLs de YouTube watch → embed */
function normalitzarEmbedUrl(url: string): string {
  try {
    const u = new URL(url)
    // https://www.youtube.com/watch?v=ID → https://www.youtube.com/embed/ID
    if ((u.hostname === 'www.youtube.com' || u.hostname === 'youtube.com') && u.pathname === '/watch') {
      const v = u.searchParams.get('v')
      if (v) return `https://www.youtube.com/embed/${v}`
    }
    // https://youtu.be/ID → https://www.youtube.com/embed/ID
    if (u.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed${u.pathname}`
    }
  } catch {
    // URL invàlida, retornar tal qual
  }
  return url
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

  const EventCard = ({ event, past = false }: { event: (typeof events)[number]; past?: boolean }) => (
    <Card className={cn('transition-colors', event.exclusiu_socis && !past && 'border-primary/20', past && 'opacity-60')}>
      {/* Imatge portada */}
      {event.imatge_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.imatge_url}
          alt={event.titol}
          className="w-full h-40 object-cover rounded-t-lg"
        />
      )}
      <CardHeader className="pb-2">
        <CardTitle className="flex items-start gap-2 text-base font-semibold">
          <span className="flex-1">{event.titol}</span>
          {event.exclusiu_socis && (
            <Lock className="size-4 text-muted-foreground shrink-0 mt-0.5" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {event.descripcio && (
          <p className="text-sm text-muted-foreground">{event.descripcio}</p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5 shrink-0" />
            <span>
              {formatData(event.data_inici)}
              {!past && ` a les ${formatHora(event.data_inici)}`}
              {event.data_fi && !past && ` — ${formatHora(event.data_fi)}`}
            </span>
          </div>
          {event.lloc && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              <span>{event.lloc}</span>
            </div>
          )}
        </div>
        {event.exclusiu_socis && !past && (
          <p className="text-xs font-medium text-primary/70">Exclusiu per a socis</p>
        )}

        {/* Vídeo incrustat */}
        {event.embed_url && (
          <div className="mt-2 space-y-1">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Video className="size-3.5" />
              {past ? 'Vídeo del partit' : 'Segueix en directe'}
            </p>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={normalitzarEmbedUrl(event.embed_url)}
                title={event.titol}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full rounded-lg border"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-8">
      {/* Capçalera */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Activitats, partits i actes del club. Els marcats amb{' '}
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
              <EventCard key={event.id} event={event} />
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
              <EventCard key={event.id} event={event} past />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
