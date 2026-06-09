import type { Metadata } from 'next'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Clock } from 'lucide-react'
import type { EstatJugador } from '@/lib/supabase/types'

export const metadata: Metadata = { title: 'Jugadors' }

const TABS: { value: EstatJugador | 'tots'; label: string }[] = [
  { value: 'pendent_aprovacio', label: 'Pendents' },
  { value: 'actiu', label: 'Actius' },
  { value: 'tots', label: 'Tots' },
]

const ESTAT_CLASSES: Record<EstatJugador, string> = {
  pendent_aprovacio: 'bg-yellow-100 text-yellow-700',
  aprovada: 'bg-blue-100 text-blue-700',
  denegada: 'bg-red-100 text-red-700',
  pendent_pagament: 'bg-orange-100 text-orange-700',
  actiu: 'bg-green-100 text-green-700',
  baixa: 'bg-muted text-muted-foreground',
}
const ESTAT_LABELS: Record<EstatJugador, string> = {
  pendent_aprovacio: 'Pendent',
  aprovada: 'Aprovada',
  denegada: 'Denegada',
  pendent_pagament: 'Pendent pagament',
  actiu: 'Actiu',
  baixa: 'Baixa',
}

export default async function JugadorsBackofficePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; equip?: string; temporada?: string }>
}) {
  const supabase = await createServiceClient()
  const params = await searchParams
  const tab = (params.tab ?? 'pendent_aprovacio') as EstatJugador | 'tots'
  const equipFilter = params.equip ?? 'tots'

  // Temporades disponibles (de més recent a més antiga)
  const { data: temporadesRaw } = await supabase
    .from('equips')
    .select('temporada')
    .order('temporada', { ascending: false })

  const temporades = [...new Set((temporadesRaw ?? []).map((e) => e.temporada))]
  const temporadaFilter = params.temporada ?? temporades[0] ?? ''

  // Equips de la temporada seleccionada (sense duplicats entre temporades)
  const { data: equips } = await supabase
    .from('equips')
    .select('id, nom')
    .eq('temporada', temporadaFilter)
    .order('nom')

  // Query jugadors amb filtres
  let query = supabase
    .from('jugadors')
    .select(`
      id,
      estat,
      temporada,
      equip_id,
      talla_samarreta,
      created_at,
      membres!inner(nom, cognom1, numero_membre),
      equips(id, nom)
    `)
    .order('created_at', { ascending: false })

  if (tab !== 'tots') query = query.eq('estat', tab)
  if (equipFilter !== 'tots') query = query.eq('equip_id', equipFilter)
  if (temporadaFilter) query = query.eq('temporada', temporadaFilter)

  const { data: jugadors } = await query

  // Count pendents (sense filtre de temporada per no perdre cap avís)
  const { count: countPendents } = await supabase
    .from('jugadors')
    .select('id', { count: 'exact', head: true })
    .eq('estat', 'pendent_aprovacio')

  // ── Helpers URL ──────────────────────────────────────────────
  const tabUrl = (t: string) => {
    const p = new URLSearchParams({ tab: t })
    if (temporadaFilter) p.set('temporada', temporadaFilter)
    if (equipFilter !== 'tots') p.set('equip', equipFilter)
    return `/backoffice/jugadors?${p}`
  }

  const temporadaUrl = (t: string) => {
    // Canviar temporada reseteja l'equip
    const p = new URLSearchParams({ tab })
    if (t) p.set('temporada', t)
    return `/backoffice/jugadors?${p}`
  }

  const equipUrl = (e: string) => {
    const p = new URLSearchParams({ tab })
    if (temporadaFilter) p.set('temporada', temporadaFilter)
    if (e !== 'tots') p.set('equip', e)
    return `/backoffice/jugadors?${p}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Jugadors</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Sol·licituds d&apos;inscripció i jugadors actius al futbol base.
        </p>
      </div>

      {/* Avís si hi ha pendents */}
      {(countPendents ?? 0) > 0 && tab !== 'pendent_aprovacio' && (
        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm text-orange-700">
          <Clock className="size-4 shrink-0" />
          Hi ha <strong>{countPendents}</strong> sol·licitud
          {countPendents !== 1 ? 's' : ''} pendent{countPendents !== 1 ? 's' : ''} d&apos;aprovació.{' '}
          <Link href={tabUrl('pendent_aprovacio')} className="underline underline-offset-4">
            Veure ara
          </Link>
        </div>
      )}

      {/* Tabs d'estat */}
      <div className="flex gap-1 border-b">
        {TABS.map(({ value, label }) => (
          <Link
            key={value}
            href={tabUrl(value)}
            className={cn(
              'px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors',
              tab === value
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
            {value === 'pendent_aprovacio' && (countPendents ?? 0) > 0 && (
              <span className="ml-1.5 rounded-full bg-orange-500 text-white text-xs px-1.5 py-0.5">
                {countPendents}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Filtres */}
      <div className="space-y-3">
        {/* Filtre temporada */}
        {temporades.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium shrink-0">Temporada:</span>
            {temporades.map((t) => (
              <Link
                key={t}
                href={temporadaUrl(t)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-colors border',
                  temporadaFilter === t
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:border-primary hover:text-primary'
                )}
              >
                {t}
              </Link>
            ))}
          </div>
        )}

        {/* Filtre equip */}
        {equips && equips.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium shrink-0">Equip:</span>
            <Link
              href={equipUrl('tots')}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors border',
                equipFilter === 'tots'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:border-primary hover:text-primary'
              )}
            >
              Tots
            </Link>
            {equips.map((equip) => (
              <Link
                key={equip.id}
                href={equipUrl(equip.id)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-colors border',
                  equipFilter === equip.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:border-primary hover:text-primary'
                )}
              >
                {equip.nom}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Llistat */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">#</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Jugador</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Equip</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Talla</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estat</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Sol·licitud</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(!jugadors || jugadors.length === 0) ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    {tab === 'pendent_aprovacio'
                      ? 'No hi ha sol·licituds pendents'
                      : 'No s\'han trobat jugadors'}
                    {equipFilter !== 'tots' && ' per a aquest equip'}
                  </td>
                </tr>
              ) : (
                jugadors.map((j) => {
                  const m = j.membres as unknown as { nom: string; cognom1: string; numero_membre: number }
                  const e = j.equips as unknown as { nom: string } | null
                  return (
                    <tr key={j.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-muted-foreground text-xs">
                        {m.numero_membre}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {m.nom} {m.cognom1}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {e?.nom ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {j.talla_samarreta ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          ESTAT_CLASSES[j.estat]
                        )}>
                          {ESTAT_LABELS[j.estat]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                        {new Intl.DateTimeFormat('ca-ES', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        }).format(new Date(j.created_at))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/backoffice/jugadors/${j.id}`}
                          className="text-xs font-medium text-primary hover:underline underline-offset-4"
                        >
                          {j.estat === 'pendent_aprovacio' ? 'Revisar' : 'Veure'}
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
