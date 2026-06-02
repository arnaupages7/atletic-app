const LLETRES = 'TRWAGMYFPDXBNJZSQVHLCKE'

/** Normalitza un DNI/NIE: majúscules, sense espais ni punts ni guions */
export function normalitzarDNI(dni: string): string {
  return dni.toUpperCase().trim().replace(/[\s.\-]/g, '')
}

/**
 * Valida el format i la lletra de control d'un DNI o NIE espanyol.
 * DNI: 8 dígits + lletra  (ex: 12345678Z)
 * NIE: X/Y/Z + 7 dígits + lletra  (ex: X1234567L)
 */
export function validarDNI(dni: string): boolean {
  const clean = normalitzarDNI(dni)

  // DNI: 8 digits + letter
  if (/^\d{8}[A-Z]$/.test(clean)) {
    return LLETRES[parseInt(clean.slice(0, 8)) % 23] === clean[8]
  }

  // NIE: X/Y/Z + 7 digits + letter
  if (/^[XYZ]\d{7}[A-Z]$/.test(clean)) {
    const num = clean.replace('X', '0').replace('Y', '1').replace('Z', '2')
    return LLETRES[parseInt(num.slice(0, 8)) % 23] === clean[8]
  }

  return false
}
