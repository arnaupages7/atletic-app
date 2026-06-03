'use server'

import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const EditarJugadorSchema = z.object({
  nom: z.string().min(1, { error: 'El nom és obligatori.' }).trim(),
  cognom1: z.string().min(1, { error: 'El primer cognom és obligatori.' }).trim(),
  cognom2: z.string().trim().optional(),
  data_naixement: z.string().min(1, { error: 'La data de naixement és obligatòria.' }),
  genere: z.enum(['M', 'F', 'A']).optional(),
  talla_samarreta: z.enum(['Miss', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'], {
    error: 'Selecciona una talla de samarreta.',
  }),
  adreca: z.string().min(1, { error: "L'adreça és obligatòria." }).trim(),
  telefon: z.string().min(9, { error: 'El telèfon ha de tenir mínim 9 dígits.' }).trim(),
  num_catsalut: z.string().min(10, { error: 'El número CATSalut ha de tenir mínim 10 caràcters.' }).trim(),
  consentiment_comunicacions: z.string().optional(),
})

export type EditarJugadorState =
  | { errors?: Record<string, string[]>; error?: string }
  | undefined

export async function editarJugadorAction(
  jugadorId: string,
  _prevState: EditarJugadorState,
  formData: FormData
): Promise<EditarJugadorState> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const serviceSupabase = await createServiceClient()

    // Verificar que el soci actual és el responsable d'aquest jugador
    const { data: soci } = await serviceSupabase
      .from('socis')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (!soci) return { error: "No s'ha trobat el teu perfil de soci." }

    const { data: jugador } = await serviceSupabase
      .from('jugadors')
      .select('id, soci_responsable_id')
      .eq('id', jugadorId)
      .single()

    if (!jugador || jugador.soci_responsable_id !== soci.id) {
      return { error: 'No tens permís per modificar aquest jugador.' }
    }

    // Validar formulari
    const raw = {
      nom: formData.get('nom') as string,
      cognom1: formData.get('cognom1') as string,
      cognom2: (formData.get('cognom2') as string) || undefined,
      data_naixement: formData.get('data_naixement') as string,
      genere: (formData.get('genere') as string) || undefined,
      talla_samarreta: formData.get('talla_samarreta') as string,
      adreca: formData.get('adreca') as string,
      telefon: formData.get('telefon') as string,
      num_catsalut: formData.get('num_catsalut') as string,
      consentiment_comunicacions: (formData.get('consentiment_comunicacions') as string) || undefined,
    }

    const parsed = EditarJugadorSchema.safeParse(raw)
    if (!parsed.success) {
      return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
    }

    // Actualitzar membres (nom, cognom, data_naix, telefon — que és a membres)
    const { error: membreError } = await serviceSupabase
      .from('membres')
      .update({
        nom: parsed.data.nom,
        cognom1: parsed.data.cognom1,
        cognom2: parsed.data.cognom2 ?? null,
        data_naixement: parsed.data.data_naixement,
        telefon: parsed.data.telefon,
      })
      .eq('id', jugadorId)

    if (membreError) {
      console.error('[editarJugador] Error actualitzant membre:', membreError)
      return { error: 'Error desant les dades. Torna-ho a intentar.' }
    }

    // Actualitzar jugadors (camps logístics)
    const { error: jugadorError } = await serviceSupabase
      .from('jugadors')
      .update({
        genere: parsed.data.genere ?? null,
        talla_samarreta: parsed.data.talla_samarreta,
        adreca: parsed.data.adreca,
        num_catsalut: parsed.data.num_catsalut,
        consentiment_comunicacions: parsed.data.consentiment_comunicacions === 'on',
      })
      .eq('id', jugadorId)

    if (jugadorError) {
      console.error('[editarJugador] Error actualitzant jugador:', jugadorError)
      return { error: 'Error desant les dades. Torna-ho a intentar.' }
    }

    redirect('/portal/jugadors?editat=1')
  } catch (err) {
    if (isRedirectError(err)) throw err
    console.error('[editarJugador] Error inesperat:', err)
    return { error: 'Error inesperat. Torna-ho a intentar.' }
  }
}
