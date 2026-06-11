import type { Metadata } from 'next'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Download } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Comanda de samarretes' }

const TALLES = ['Miss', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] as const

function buildTallesVisibles(totals: Record<string, number>) {
  return (totals['S/T'] ?? 0) > 0 ? [...TALLES, 'S/T'] : [...TALLES]
}

function CellNum({ n }: { n: number }) {
  return n > 0
    ? <span className="font-semibold tabular-nums">{n}</span>
    : <span className="text-muted-foreground/30 select-none">—</span>
}

export default async function SamarretesPage() {
  const supabase = await createServiceClient()

  // ── Jugadors ────────────────────────────────────────────────
  const { data: jugadors } = await supabase
    .from('jugadors')
    .select('talla_samarreta, equip_id, equips(nom)')
    .in('estat', ['actiu', 'aprovada', 'pendent_pagament'])

  const pivotJugadors = new Map<string, { nom: string; counts: Record<string, number> }>()
  for (const j of jugadors ?? []) {
    const equipId = j.equip_id ?? '__sense_equip__'
    const equip = j.equips as unknown as { nom: string } | null
    const nomEquip = equip?.nom ?? 'Sense equip'
    const talla: string = j.talla_samarreta ?? 'S/T'
    if (!pivotJugadors.has(equipId)) pivotJugadors.set(equipId, { nom: nomEquip, counts: {} })
    const row = pivotJugadors.get(equipId)!
    row.counts[talla] = (row.counts[talla] ?? 0) + 1
  }

  const rowsJugadors = Array.from(pivotJugadors.entries()).sort(([idA, a], [idB, b]) => {
    if (idA === '__sense_equip__') return 1
    if (idB === '__sense_equip__') return -1
    return a.nom.localeCompare(b.nom, 'ca')
  })

  const totalsJugadors: Record<string, number> = {}
  for (const [, row] of rowsJugadors)
    for (const [t, n] of Object.entries(row.counts))
      totalsJugadors[t] = (totalsJugadors[t] ?? 0) + n

  const grandTotalJugadors = Object.values(totalsJugadors).reduce((a, b) => a + b, 0)
  const tallesJugadors = buildTallesVisibles(totalsJugadors)

  // ── Socis ───────────────────────────────────────────────────
  const { data: socis } = await supabase
    .from('socis')
    .select('talla_samarreta')
    .eq('estat', 'actiu')

  const countsSocis: Record<string, number> = {}
  for (const s of socis ?? []) {
    const talla: string = s.talla_samarreta ?? 'S/T'
    countsSocis[talla] = (countsSocis[talla] ?? 0) + 1
  }

  const grandTotalSocis = Object.values(countsSocis).reduce((a, b) => a + b, 0)
  const tallesSocis = buildTallesVisibles(countsSocis)

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Comanda de samarretes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Unitats per talla · Jugadors actius/aprovats i socis actius
          </p>
        </div>
        <Link
          href="/api/samarretes/export"
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5 shrink-0')}
        >
          <Download className="size-4" />
          Exportar Excel
        </Link>
      </div>

      {/* ── Taula jugadors ── */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Samarretes jugadors</h2>
          <p className="text-xs text-muted-foreground">Per equip · actius, aprovats i pendents de pagament</p>
        </div>
        {rowsJugadors.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            No hi ha jugadors inscrits per mostrar.
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Equip</th>
                    {tallesJugadors.map((t) => (
                      <th key={t} className="text-center px-3 py-3 font-medium text-muted-foreground min-w-[3.5rem]">{t}</th>
                    ))}
                    <th className="text-center px-4 py-3 font-semibold min-w-[4rem]">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rowsJugadors.map(([equipId, row]) => {
                    const rowTotal = Object.values(row.counts).reduce((a, b) => a + b, 0)
                    return (
                      <tr key={equipId} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 font-medium">{row.nom}</td>
                        {tallesJugadors.map((t) => (
                          <td key={t} className="px-3 py-2.5 text-center">
                            <CellNum n={row.counts[t] ?? 0} />
                          </td>
                        ))}
                        <td className="px-4 py-2.5 text-center font-bold tabular-nums">{rowTotal}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-muted/50">
                    <td className="px-4 py-2.5 font-bold">Total</td>
                    {tallesJugadors.map((t) => (
                      <td key={t} className="px-3 py-2.5 text-center font-bold tabular-nums">
                        <CellNum n={totalsJugadors[t] ?? 0} />
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-center font-bold tabular-nums">{grandTotalJugadors}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        )}
      </section>

      {/* ── Taula socis ── */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Samarretes socis</h2>
          <p className="text-xs text-muted-foreground">Socis actius</p>
        </div>
        {grandTotalSocis === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            No hi ha socis actius amb talla registrada.
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {tallesSocis.map((t) => (
                      <th key={t} className="text-center px-3 py-3 font-medium text-muted-foreground min-w-[3.5rem]">{t}</th>
                    ))}
                    <th className="text-center px-4 py-3 font-semibold min-w-[4rem]">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-muted/30 transition-colors">
                    {tallesSocis.map((t) => (
                      <td key={t} className="px-3 py-3 text-center">
                        <CellNum n={countsSocis[t] ?? 0} />
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center font-bold tabular-nums">{grandTotalSocis}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>
    </div>
  )
}
