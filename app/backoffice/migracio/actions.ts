'use server'

import * as XLSX from 'xlsx'
import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue }
    if ((ch === ',' || ch === ';') && !inQuotes) {
      result.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  result.push(current.trim())
  return result
}

/** Extreu files de qualsevol format acceptable (xlsx, xls, csv via File) */
async function parseFile(file: File): Promise<string[][]> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const name = file.name.toLowerCase()

  if (name.endsWith('.csv') || file.type === 'text/csv' || file.type === 'text/plain') {
    // CSV: parseig manual existent
    const text = buffer.toString('utf-8')
    return text
      .split('\n')
      .filter(l => l.trim())
      .map(l => parseCSVLine(l))
  }

  // xlsx / xls via SheetJS
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return []
  const sheet = workbook.Sheets[sheetName]
  // header:1 → retorna array de arrays; defval:'' → cel·les buides com a string buit
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })
  return rows.map(row =>
    (row as unknown[]).map(cell => String(cell ?? '').trim())
  )
}

// ── Types ────────────────────────────────────────────────────────────────────

export type ImportResult =
  | { importats: number; errors: { linia: number; missatge: string }[] }
  | { error: string }

export type SequenciaResult =
  | { success: true; inici: number }
  | { error: string }

export type EsborrarResult =
  | { success: true; esborrats: number }
  | { error: string }

// ── Actions ──────────────────────────────────────────────────────────────────

/**
 * Importa fitxer xlsx, xls o csv amb format: DNI, numero_membre [, nom, cognom1]
 * La primera fila s'ignora si és una capçalera de text.
 */
export async function importarMigracioAction(
  _prev: unknown,
  formData: FormData
): Promise<ImportResult> {
  const file = formData.get('fitxer') as File | null
  if (!file || file.size === 0) return { error: 'Selecciona un fitxer abans d\'importar.' }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const extesionsAcceptades = ['xlsx', 'xls', 'csv']
  if (!extesionsAcceptades.includes(ext)) {
    return { error: 'Format no acceptat. Utilitza .xlsx, .xls o .csv.' }
  }

  let matriu: string[][]
  try {
    matriu = await parseFile(file)
  } catch (err) {
    console.error('[importarMigracio] error parsejant fitxer:', err)
    return { error: 'No s\'ha pogut llegir el fitxer. Comprova que el format és correcte.' }
  }

  if (matriu.length === 0) return { error: 'El fitxer és buit.' }

  const rows: {
    dni: string
    numero_membre: number
    nom?: string
    cognom1?: string
  }[] = []
  const errors: { linia: number; missatge: string }[] = []

  for (let i = 0; i < matriu.length; i++) {
    const linia = i + 1
    const cols = matriu[i]

    const dni = cols[0]?.replace(/[^A-Z0-9]/gi, '').trim().toUpperCase()
    const numStr = cols[1]?.replace(/['"]/g, '').trim()

    // Saltar capçalera si la primera cel·la no sembla un DNI (conté lletres seguides)
    if (linia === 1 && isNaN(parseInt(numStr ?? ''))) continue

    if (!dni || dni.length < 8) {
      errors.push({ linia, missatge: `DNI invàlid: "${dni}"` })
      continue
    }
    const num = parseInt(numStr ?? '')
    if (isNaN(num) || num < 1) {
      errors.push({ linia, missatge: `Número de soci invàlid: "${numStr}"` })
      continue
    }

    rows.push({
      dni,
      numero_membre: num,
      nom: cols[2]?.trim() || undefined,
      cognom1: cols[3]?.trim() || undefined,
    })
  }

  if (rows.length === 0) return { error: 'No s\'han trobat files vàlides al fitxer.' }

  // Desduplicar per DNI: si un DNI apareix més d'una vegada, queda la darrera fila
  const mapRows = new Map(rows.map(r => [r.dni, r]))
  const rowsUnics = Array.from(mapRows.values())

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('migracio_socis')
    .upsert(rowsUnics, { onConflict: 'dni' })
    .select('dni')

  if (error) return { error: `Error de base de dades: ${error.message}` }

  revalidatePath('/backoffice/migracio')
  return { importats: data?.length ?? rows.length, errors }
}

/**
 * Ajusta el punt d'inici de la seqüència de numero_membre.
 * Tots els nous socis sense coincidència al CSV rebran aquest número o superior.
 */
export async function ajustarSequenciaAction(
  _prev: unknown,
  formData: FormData
): Promise<SequenciaResult> {
  const inicIRaw = formData.get('inici') as string | null
  const inici = parseInt(inicIRaw ?? '')
  if (isNaN(inici) || inici < 1) return { error: 'Número no vàlid.' }

  const supabase = await createServiceClient()
  const { error } = await supabase.rpc('set_sequencia_numero_membre', { inici })
  if (error) return { error: `Error: ${error.message}` }

  // Persistir el valor configurat per mostrar-lo al refresc de pàgina
  await supabase.from('configuracio').upsert(
    { clau: 'sequencia_inici_socis', valor: String(inici), actualitzat_el: new Date().toISOString() },
    { onConflict: 'clau' }
  )

  revalidatePath('/backoffice/migracio')
  return { success: true, inici }
}

/**
 * Esborra els registres de migració que encara no s'han assignat.
 */
export async function esborrarPendentsAction(
  _prev: unknown,
  _formData: FormData
): Promise<EsborrarResult> {
  const supabase = await createServiceClient()
  const { count, error } = await supabase
    .from('migracio_socis')
    .delete({ count: 'exact' })
    .eq('assignat', false)

  if (error) return { error: error.message }
  revalidatePath('/backoffice/migracio')
  return { success: true, esborrats: count ?? 0 }
}
