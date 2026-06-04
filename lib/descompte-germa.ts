/**
 * Calcula el preu final en cèntims aplicant el descompte de germà/na.
 *
 * @param preuBaseCents  Preu base en cèntims (e.g. 30000 = 300 €)
 * @param tipus          'import_fix' | 'percentatge' (o null → fallback 25 €)
 * @param valor          Euros per a import_fix, % per a percentatge (guardat com a string)
 */
export function aplicarDescompteGerma(
  preuBaseCents: number,
  tipus: string | null | undefined,
  valor: string | null | undefined
): number {
  if (!valor) {
    // Fallback si no hi ha configuració: 25 € fixos
    return Math.max(0, preuBaseCents - 2500)
  }
  const valorNum = parseFloat(valor)
  if (isNaN(valorNum) || valorNum <= 0) return preuBaseCents

  if (tipus === 'percentatge') {
    const descompteCents = Math.round(preuBaseCents * valorNum / 100)
    return Math.max(0, preuBaseCents - descompteCents)
  }
  // import_fix: valor en euros → convertir a cèntims
  const descompteCents = Math.round(valorNum * 100)
  return Math.max(0, preuBaseCents - descompteCents)
}

/**
 * Retorna un text llegible del descompte (ex: "25 €" o "10%")
 */
export function formatDescompteGerma(
  tipus: string | null | undefined,
  valor: string | null | undefined
): string {
  if (!valor) return '25 €'
  const valorNum = parseFloat(valor)
  if (isNaN(valorNum)) return '25 €'
  return tipus === 'percentatge' ? `${valorNum} %` : `${valorNum} €`
}
