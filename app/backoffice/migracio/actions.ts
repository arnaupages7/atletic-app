'use server'

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
 * Importa CSV amb format: DNI,numero_membre[,nom,cognom1]
 * Accepta separador coma o punt i coma.
 */
export async function importarMigracioAction(
  _prev: unknown,
  formData: FormData
): Promise<ImportResult> {
  const csv = (formData.get('csv') as string | null)?.trim()
  if (!csv) return { error: 'Cal enganxar les dades.' }

  const lines = csv.split('\n').filter(l => l.trim())
  const rows: {
    dni: string
    numero_membre: number
    nom?: string
    cognom1?: string
  }[] = []
  const errors: { linia: number; missatge: string }[] = []

  for (let i = 0; i < lines.length; i++) {
    const linia = i + 1
    const cols = parseCSVLine(lines[i])

    const dni = cols[0]?.replace(/['"]/g, '').trim().toUpperCase()
    const numStr = cols[1]?.replace(/['"]/g, '').trim()

    // Saltar capçalera si és text
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

  if (rows.length === 0) return { error: 'No s\'han trobat files vàlides al CSV.' }

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('migracio_socis')
    .upsert(rows, { onConflict: 'dni' })
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
