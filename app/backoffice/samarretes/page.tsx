import type { Metadata } from 'next'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Download } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Comanda de samarretes' }

const TALLES = ['Miss', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] as const

export default async function SamarretesPage() {
  const supabase = await createServiceClient()

  const { data: jugadors } = await supabase
    .from('jugadors')
    .select('talla_samarreta, equip_id, equips(nom)')
    .in('estat', ['actiu', 'aprovada', 'pendent_pagament'])

  // Construïm el pivot: equip_id → { nom, counts }
  const pivot = new Map<string, { nom: string; counts: Record<string, number> }>()

  for (const j of jugadors ?? []) {
    const equipId = j.equip_id ?? '__sense_equip__'
    const equip = j.equips as unknown as { nom: string } | null
    const nomEquip = equip?.nom ?? 'Sense equip'
    const talla: string = j.talla_samarreta ?? 'S/T'

    if (!pivot.has(equipId)) {
      pivot.set(equipId, { nom: nomEquip, counts: {} })
    }
    const row = pivot.get(equipId)!
    row.counts[talla] = (row.counts[talla] ?? 0) + 1
  }

  // Ordenem per nom d'equip; "Sense equip" al final
  const rows = Array.from(pivot.entries()).sort(([idA, a], [idB, b]) => {
    if (idA === '__sense_equip__') return 1
    if (idB === '__sense_equip__') return -1
    return a.nom.localeCompare(b.nom, 'ca')
  })

  // Totals globals per talla
  const totals: Record<string, number> = {}
  for (const [, row] of rows) {
    for (const [talla, count] of Object.entries(row.counts)) {
      totals[talla] = (totals[talla] ?? 0) + count
    }
  }
  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0)

  // Columna "S/T" (sense talla) només si hi ha algun jugador sense talla registrada
  const hasSenseTalla = (totals['S/T'] ?? 0) > 0
  const tallesVisibles: string[] = hasSenseTalla ? [...TALLES, 'S/T'] : [...TALLES]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Comanda de samarretes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Unitats per talla i equip · Jugadors actius, aprovats i pendents de pagament
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

      {rows.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-muted-foreground text-sm">
            No hi ha jugadors inscrits per mostrar.
          </p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Equip
                  </th>
                  {tallesVisibles.map((t) => (
                    <th
                      key={t}
                      className="text-center px-3 py-3 font-medium text-muted-foreground min-w-[3.5rem]"
                    >
                      {t}
                    </th>
                  ))}
                  <th className="text-center px-4 py-3 font-semibold min-w-[4rem]">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map(([equipId, row]) => {
                  const rowTotal = Object.values(row.counts).reduce((a, b) => a + b, 0)
                  return (
                    <tr key={equipId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5 font-medium">{row.nom}</td>
                      {tallesVisibles.map((t) => {
                        const n = row.counts[t] ?? 0
                        return (
                          <td key={t} className="px-3 py-2.5 text-center">
                            {n > 0 ? (
                              <span className="font-semibold tabular-nums">{n}</span>
                            ) : (
                              <span className="text-muted-foreground/30 select-none">—</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-4 py-2.5 text-center font-bold tabular-nums">
                        {rowTotal}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-muted/50">
                  <td className="px-4 py-2.5 font-bold">Total</td>
                  {tallesVisibles.map((t) => {
                    const n = totals[t] ?? 0
                    return (
                      <td key={t} className="px-3 py-2.5 text-center font-bold tabular-nums">
                        {n > 0 ? (
                          n
                        ) : (
                          <span className="text-muted-foreground/30 select-none">—</span>
                        )}
                      </td>
                    )
                  })}
                  <td className="px-4 py-2.5 text-center font-bold tabular-nums">
                    {grandTotal}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
