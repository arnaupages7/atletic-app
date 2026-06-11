import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const TALLES = ['Miss', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] as const

function tallesVisibles(totals: Record<string, number>): string[] {
  return (totals['S/T'] ?? 0) > 0 ? [...TALLES, 'S/T'] : [...TALLES]
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

  const serviceSupabase = await createServiceClient()

  // ── Jugadors ──────────────────────────────────────────────
  const { data: jugadors } = await serviceSupabase
    .from('jugadors')
    .select('talla_samarreta, equip_id, equips(nom)')
    .in('estat', ['actiu', 'aprovada', 'pendent_pagament'])

  const pivot = new Map<string, { nom: string; counts: Record<string, number> }>()
  for (const j of jugadors ?? []) {
    const equipId = j.equip_id ?? '__sense_equip__'
    const equip = j.equips as unknown as { nom: string } | null
    const nomEquip = equip?.nom ?? 'Sense equip'
    const talla: string = j.talla_samarreta ?? 'S/T'
    if (!pivot.has(equipId)) pivot.set(equipId, { nom: nomEquip, counts: {} })
    const row = pivot.get(equipId)!
    row.counts[talla] = (row.counts[talla] ?? 0) + 1
  }

  const rowsJugadors = Array.from(pivot.entries()).sort(([idA, a], [idB, b]) => {
    if (idA === '__sense_equip__') return 1
    if (idB === '__sense_equip__') return -1
    return a.nom.localeCompare(b.nom, 'ca')
  })

  const totalsJugadors: Record<string, number> = {}
  for (const [, row] of rowsJugadors)
    for (const [t, n] of Object.entries(row.counts))
      totalsJugadors[t] = (totalsJugadors[t] ?? 0) + n

  const tallesJ = tallesVisibles(totalsJugadors)
  const grandTotalJ = Object.values(totalsJugadors).reduce((a, b) => a + b, 0)

  const wsJugadors = XLSX.utils.aoa_to_sheet([
    ['Equip', ...tallesJ, 'Total'],
    ...rowsJugadors.map(([, row]) => {
      const rowTotal = Object.values(row.counts).reduce((a, b) => a + b, 0)
      return [row.nom, ...tallesJ.map((t) => row.counts[t] ?? 0), rowTotal]
    }),
    ['Total', ...tallesJ.map((t) => totalsJugadors[t] ?? 0), grandTotalJ],
  ])
  wsJugadors['!cols'] = [{ wch: 24 }, ...tallesJ.map(() => ({ wch: 8 })), { wch: 8 }]

  // ── Socis ─────────────────────────────────────────────────
  const { data: socis } = await serviceSupabase
    .from('socis')
    .select('talla_samarreta')
    .eq('estat', 'actiu')

  const countsSocis: Record<string, number> = {}
  for (const s of socis ?? []) {
    const talla: string = s.talla_samarreta ?? 'S/T'
    countsSocis[talla] = (countsSocis[talla] ?? 0) + 1
  }

  const tallesS = tallesVisibles(countsSocis)
  const grandTotalS = Object.values(countsSocis).reduce((a, b) => a + b, 0)

  const wsSocis = XLSX.utils.aoa_to_sheet([
    [...tallesS, 'Total'],
    [...tallesS.map((t) => countsSocis[t] ?? 0), grandTotalS],
  ])
  wsSocis['!cols'] = [...tallesS.map(() => ({ wch: 8 })), { wch: 8 }]

  // ── Excel ─────────────────────────────────────────────────
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, wsJugadors, 'Jugadors')
  XLSX.utils.book_append_sheet(wb, wsSocis, 'Socis')

  const raw = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Uint8Array
  const ab = new ArrayBuffer(raw.byteLength)
  new Uint8Array(ab).set(raw)

  const date = new Date().toISOString().slice(0, 10)
  return new NextResponse(new Blob([ab], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="samarretes-${date}.xlsx"`,
    },
  })
}
