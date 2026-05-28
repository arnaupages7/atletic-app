import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react'
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
  pendent_aprovacio: "Pendent",
  aprovada: 'Aprovada',
  denegada: 'Denegada',
  pendent_pagament: 'Pendent pagament',
  actiu: 'Actiu',
  baixa: 'Baixa',
}

export default async function JugadorsBackofficePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const tab = (params.tab ?? 'pendent_aprovacio') as EstatJugador | 'tots'

  let query = supabase
    .from('jugadors')
    .select(`
      id,
      estat,
      temporada,
      created_at,
      membres!inner(nom, cognom1, numero_membre),
      equips(nom)
    `)
    .order('created_at', { ascending: false })

  if (tab !== 'tots') {
    query = query.eq('estat', tab)
  }

  const { data: jugadors } = await query

  // Count pendents per badge
  const { count: countPendents } = await supabase
    .from('jugadors')
    .select('id', { count: 'exact', head: true })
    .eq('estat', 'pendent_aprovacio')

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
          <Link href="/backoffice/jugadors?tab=pendent_aprovacio" className="underline underline-offset-4">
            Veure ara
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {TABS.map(({ value, label }) => (
          <Link
            key={value}
            href={`/backoffice/jugadors?tab=${value}`}
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

      {/* Llistat */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">#</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Jugador</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Equip</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estat</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Sol·licitud</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(!jugadors || jugadors.length === 0) ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    {tab === 'pendent_aprovacio'
                      ? 'No hi ha sol·licituds pendents'
                      : 'No s\'han trobat jugadors'}
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
