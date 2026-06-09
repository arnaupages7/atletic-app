import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  // Només accessible per gestors autenticats
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

  // Crear el workbook de mostra
  const wb = XLSX.utils.book_new()

  const dades = [
    ['DNI', 'NUM_SOCI', 'NOM', 'COGNOM'],   // capçalera
    ['12345678A', 42, 'Joan', 'García'],
    ['87654321B', 101, 'Maria', 'López'],
    ['11223344C', 205, 'Pere', 'Puig'],
    ['44332211D', 310, 'Anna', 'Martí'],
  ]

  const ws = XLSX.utils.aoa_to_sheet(dades)

  // Amplada de columnes
  ws['!cols'] = [
    { wch: 14 }, // DNI
    { wch: 12 }, // NUM_SOCI
    { wch: 16 }, // NOM
    { wch: 20 }, // COGNOM
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Socis')

  const raw = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Uint8Array
  // Copiem a un ArrayBuffer net per evitar problemes de tipus amb SharedArrayBuffer
  const ab = new ArrayBuffer(raw.byteLength)
  new Uint8Array(ab).set(raw)
  const blob = new Blob([ab], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  return new NextResponse(blob, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="model-migracio-socis.xlsx"',
    },
  })
}
