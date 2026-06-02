import { z } from 'zod'
import { validarDNI } from '@/lib/dni'

export const RegistreSchema = z
  .object({
    // Compte
    email: z.email({ error: 'Adreça de correu no vàlida.' }),
    password: z
      .string()
      .min(8, { error: 'La contrasenya ha de tenir mínim 8 caràcters.' }),
    password_confirm: z.string(),

    // Dades personals
    nom: z.string().min(1, { error: 'El nom és obligatori.' }).trim(),
    cognom1: z.string().min(1, { error: 'El primer cognom és obligatori.' }).trim(),
    cognom2: z.string().trim().optional(),
    dni: z
      .string()
      .min(1, { error: 'El DNI/NIE és obligatori.' })
      .trim()
      .refine(validarDNI, { error: 'DNI/NIE no vàlid. Comprova el format i la lletra de control.' }),
    data_naixement: z.string().min(1, { error: 'La data de naixement és obligatòria.' }),
    genere: z.string().optional(),
    talla_samarreta: z
      .enum(['Miss', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'])
      .optional(),

    // Contacte
    telefon: z.string().min(1, { error: 'El telèfon és obligatori.' }).trim(),
    adreca: z.string().min(1, { error: 'L\'adreça és obligatòria.' }).trim(),
    codi_postal: z.string().min(1, { error: 'El codi postal és obligatori.' }).trim(),
    poblacio: z.string().min(1, { error: 'La població és obligatòria.' }).trim(),
    provincia: z.string().optional(),

    // Consentiments
    consentiment_privacitat: z.literal('on', {
      error: 'Cal acceptar la política de privacitat per continuar.',
    }),
    consentiment_comunicacions: z.string().optional(),
  })
  .refine((d) => d.password === d.password_confirm, {
    error: 'Les contrasenyes no coincideixen.',
    path: ['password_confirm'],
  })

export type RegistreInput = z.infer<typeof RegistreSchema>
