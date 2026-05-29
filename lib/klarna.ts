// Comissió Klarna (Pay in 3) que es trasllada al client
export const KLARNA_FEE_PCT = 0.04   // 4%
export const KLARNA_FEE_FIXED = 35   // 0,35 € en cèntims

/** Retorna l'import total que pagarà el client si tria Klarna (en cèntims) */
export function importAmbKlarna(base: number): number {
  return Math.ceil(base * (1 + KLARNA_FEE_PCT) + KLARNA_FEE_FIXED)
}
