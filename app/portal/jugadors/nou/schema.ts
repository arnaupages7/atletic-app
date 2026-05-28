import { z } from 'zod'

export const InscripcioJugadorSchema = z.object({
  // Dades personals del jugador
  nom: z.string().min(1, { error: 'El nom és obligatori.' }).trim(),
  cognom1: z.string().min(1, { error: 'El primer cognom és obligatori.' }).trim(),
  cognom2: z.string().trim().optional(),
  data_naixement: z.string().min(1, { error: 'La data de naixement és obligatòria.' }),
  genere: z.enum(['M', 'F', 'A']).optional(),
  dni: z.string().min(9, { error: 'El DNI/NIE és obligatori (mínim 9 caràcters).' }).trim(),

  // Inscripció esportiva
  equip_id: z.string().uuid({ error: 'Selecciona un equip vàlid.' }),
  talla_samarreta: z.enum(['Miss', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'], {
    error: 'Selecciona una talla de samarreta.',
  }),

  // Contacte
  adreca: z.string().min(1, { error: "L'adreça és obligatòria." }).trim(),
  telefon: z
    .string()
    .min(9, { error: 'El telèfon ha de tenir mínim 9 dígits.' })
    .trim(),

  // Informació mèdica
  num_catsalut: z
    .string()
    .min(10, { error: 'El número CATSalut ha de tenir mínim 10 caràcters.' })
    .trim(),

  // Consentiments
  consentiment_privacitat: z.literal('on', {
    error: 'Cal acceptar la política de privacitat per continuar.',
  }),
  consentiment_comunicacions: z.string().optional(),
})

export type InscripcioJugadorInput = z.infer<typeof InscripcioJugadorSchema>
