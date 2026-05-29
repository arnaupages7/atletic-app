import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { Users, Clock, CheckCircle2, XCircle, AlertCircle, PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EstatJugador } from '@/lib/supabase/types'
import { PagarQuotaButton } from './_components/pagar-quota-button'

export const metadata: Metadata = { title: 'Els meus jugadors' }

const ESTAT_CONFIG: Record<EstatJugador, { label: string; icon: React.ElementType; class: string }> = {
  pendent_aprovacio: {
    label: 'Pendent d\'aprovació',
    icon: Clock,
    class: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 dark:text-yellow-400',
  },
  aprovada: {
    label: 'Aprovada — pendent de pagament',
    icon: AlertCircle,
    class: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400',
  },
  denegada: {
    label: 'Denegada',
    icon: XCircle,
    class: 'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400',
  },
  pendent_pagament: {
    label: 'Pendent de pagament',
    icon: AlertCircle,
    class: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400',
  },
  actiu: {
    label: 'Actiu',
    icon: CheckCircle2,
    class: 'text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400',
  },
  baixa: {
    label: 'Baixa',
    icon: XCircle,
    class: 'text-muted-foreground bg-muted',
  },
}

export default async function JugadorsPage({
  searchParams,
}: {
  searchParams: Promise<{ nova?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const novaInscripcio = params.nova === '1'

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Obtenir id del soci + estat
  const { data: soci } = await supabase
    .from('socis')
    .select('id, estat')
    .eq('user_id', user.id)
    .single()

  if (!soci) redirect('/login')

  // Obtenir jugadors del soci + dades del membre + equip
  const { data: jugadors } = await supabase
    .from('jugadors')
    .select(`
      id,
      estat,
      temporada,
      motiu_denegacio,
      created_at,
      equip_id
    `)
    .eq('soci_responsable_id', soci.id)
    .order('created_at', { ascending: false })

  // Obtenir noms dels jugadors (des de membres)
  const jugadorIds = jugadors?.map((j) => j.id) ?? []
  const { data: membreJugadors } = jugadorIds.length > 0
    ? await supabase
        .from('membres')
        .select('id, nom, cognom1, numero_membre')
        .in('id', jugadorIds)
    : { data: [] }

  // Obtenir noms dels equips
  const equipIds = [...new Set(jugadors?.map((j) => j.equip_id).filter(Boolean) ?? [])]
  const { data: equips } = equipIds.length > 0
    ? await supabase
        .from('equips')
        .select('id, nom')
        .in('id', equipIds as string[])
    : { data: [] }

  const membreMap = Object.fromEntries((membreJugadors ?? []).map((m) => [m.id, m]))
  const equipMap = Object.fromEntries((equips ?? []).map((e) => [e.id, e]))

  // Descompte germà: si ja hi ha algun jugador actiu, el segon en paga menys
  const teGerma = (jugadors ?? []).some((j) => j.estat === 'actiu')
  const importBase = teGerma ? 27500 : 30000

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Els meus jugadors</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Inscripcions de jugadors al futbol base.
          </p>
        </div>
        {soci?.estat === 'actiu' ? (
          <Link
            href="/portal/jugadors/nou"
            className={cn(buttonVariants({ size: 'sm' }), 'shrink-0 gap-1.5')}
          >
            <PlusCircle className="size-4" />
            Inscriure jugador
          </Link>
        ) : (
          <div
            className="px-3 py-2 rounded-md bg-muted text-muted-foreground text-sm cursor-not-allowed select-none text-xs"
            title="Cal tenir la quota de soci activa"
          >
            Inscriure jugador
          </div>
        )}
      </div>

      {/* Banner confirmació nova inscripció */}
      {novaInscripcio && (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
          <CheckCircle2 className="size-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              Sol·licitud enviada correctament
            </p>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              El club revisarà la inscripció i et notificarà per correu. Pots seguir
              l&apos;estat aquí.
            </p>
          </div>
        </div>
      )}

      {(!jugadors || jugadors.length === 0) ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Users className="size-8 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            Encara no tens cap jugador inscrit.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Aviat podràs inscriure jugadors directament des d&apos;aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jugadors.map((jugador) => {
            const membre = membreMap[jugador.id]
            const equip = jugador.equip_id ? equipMap[jugador.equip_id] : null
            const estatCfg = ESTAT_CONFIG[jugador.estat]
            const EstatIcon = estatCfg.icon

            return (
              <Card key={jugador.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-start justify-between gap-3 text-base">
                    <div>
                      {membre
                        ? `${membre.nom} ${membre.cognom1}`
                        : 'Jugador'}
                      {membre?.numero_membre && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          #{membre.numero_membre}
                        </span>
                      )}
                    </div>
                    <span className={cn(
                      'flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full shrink-0',
                      estatCfg.class
                    )}>
                      <EstatIcon className="size-3.5" />
                      {estatCfg.label}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {equip && (
                    <p className="text-sm text-muted-foreground">
                      Equip: <span className="font-medium text-foreground">{equip.nom}</span>
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Temporada {jugador.temporada} · Inscripció:{' '}
                    {new Intl.DateTimeFormat('ca-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }).format(new Date(jugador.created_at))}
                  </p>
                  {jugador.estat === 'denegada' && jugador.motiu_denegacio && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      Motiu: {jugador.motiu_denegacio}
                    </p>
                  )}
                  {jugador.estat === 'aprovada' && (
                    <div className="pt-3 border-t mt-3">
                      <p className="text-xs text-muted-foreground mb-2">
                        La inscripció ha estat aprovada. Completa el pagament per activar la plaça.
                      </p>
                      <PagarQuotaButton jugadorId={jugador.id} importBase={importBase} />
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
