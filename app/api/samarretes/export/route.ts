import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const TALLES = ['Miss', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] as const

export async function GET() {
  // Requereix gestor autenticat
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

  const serviceSupabase = await createServiceClient()

  const { data: jugadors } = await serviceSupabase
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

  const rows = Array.from(pivot.entries()).sort(([idA, a], [idB, b]) => {
    if (idA === '__sense_equip__') return 1
    if (idB === '__sense_equip__') return -1
    return a.nom.localeCompare(b.nom, 'ca')
  })

  const totals: Record<string, number> = {}
  for (const [, row] of rows) {
    for (const [talla, count] of Object.entries(row.counts)) {
      totals[talla] = (totals[talla] ?? 0) + count
    }
  }

  const hasSenseTalla = (totals['S/T'] ?? 0) > 0
  const tallesVisibles: string[] = hasSenseTalla ? [...TALLES, 'S/T'] : [...TALLES]
  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0)

  // Construïm les files del full de càlcul
  const headers = ['Equip', ...tallesVisibles, 'Total']
  const dataRows = rows.map(([, row]) => {
    const rowTotal = Object.values(row.counts).reduce((a, b) => a + b, 0)
    return [row.nom, ...tallesVisibles.map((t) => row.counts[t] ?? 0), rowTotal]
  })
  const totalRow = ['Total', ...tallesVisibles.map((t) => totals[t] ?? 0), grandTotal]

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows, totalRow])

  // Amplades de columna
  ws['!cols'] = [
    { wch: 24 }, // Equip
    ...tallesVisibles.map(() => ({ wch: 8 })),
    { wch: 8 }, // Total
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Samarretes')

  const raw = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Uint8Array
  const ab = new ArrayBuffer(raw.byteLength)
  new Uint8Array(ab).set(raw)
  const blob = new Blob([ab], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const date = new Date().toISOString().slice(0, 10)
  return new NextResponse(blob, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="samarretes-${date}.xlsx"`,
    },
  })
}
