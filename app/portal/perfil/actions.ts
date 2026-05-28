'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const PerfilSchema = z.object({
  nom: z.string().min(2, 'El nom ha de tenir almenys 2 caràcters'),
  cognom1: z.string().min(2, 'El primer cognom ha de tenir almenys 2 caràcters'),
  cognom2: z.string().optional(),
  telefon: z
    .string()
    .regex(/^[0-9\s\+\-]{9,15}$/, 'Telèfon no vàlid')
    .optional()
    .or(z.literal('')),
  adreca: z.string().min(5, 'L\'adreça ha de tenir almenys 5 caràcters'),
  codi_postal: z
    .string()
    .regex(/^[0-9]{5}$/, 'Codi postal no vàlid (5 dígits)'),
  poblacio: z.string().min(2, 'La població ha de tenir almenys 2 caràcters'),
  provincia: z.string().optional().or(z.literal('')),
  talla_samarreta: z
    .enum(['Miss', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'])
    .optional()
    .or(z.literal('')),
})

export type PerfilState =
  | { errors?: Record<string, string[]>; error?: string; success?: boolean }
  | undefined

export async function actualitzarPerfilAction(
  _prevState: PerfilState,
  formData: FormData
): Promise<PerfilState> {
  // 1. Verificar autenticació
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 2. Obtenir id del soci per verificar propietat
  const { data: soci } = await supabase
    .from('socis')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!soci) return { error: 'No s\'hem trobat el teu perfil. Torna a entrar.' }

  // 3. Validar formulari
  const raw = Object.fromEntries(formData.entries())
  const parsed = PerfilSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const {
    nom,
    cognom1,
    cognom2,
    telefon,
    adreca,
    codi_postal,
    poblacio,
    provincia,
    talla_samarreta,
  } = parsed.data

  // 4. Actualitzar `membres` (via service role — policy membres_update és gestor only)
  //    La identitat ja ha estat verificada al pas 2.
  const serviceSupabase = await createServiceClient()

  const { error: membreError } = await serviceSupabase
    .from('membres')
    .update({
      nom,
      cognom1,
      cognom2: cognom2 || null,
      telefon: telefon || null,
    })
    .eq('id', soci.id)

  if (membreError) {
    return { error: 'Error actualitzant les dades personals. Torna-ho a intentar.' }
  }

  // 5. Actualitzar `socis` (via user session — socis_update_own ho permet)
  const { error: sociError } = await supabase
    .from('socis')
    .update({
      adreca,
      codi_postal,
      poblacio,
      provincia: provincia || null,
      talla_samarreta: (talla_samarreta as 'Miss' | 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL') || null,
    })
    .eq('user_id', user.id)

  if (sociError) {
    return { error: 'Error actualitzant les dades de contacte. Torna-ho a intentar.' }
  }

  return { success: true }
}
