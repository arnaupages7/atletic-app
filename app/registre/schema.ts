import { z } from 'zod'
import { validarDNI } from '@/lib/dni'

function calcularEdat(isoDate: string): number {
  const avui = new Date()
  const naix = new Date(isoDate)
  let edat = avui.getFullYear() - naix.getFullYear()
  const m = avui.getMonth() - naix.getMonth()
  if (m < 0 || (m === 0 && avui.getDate() < naix.getDate())) edat--
  return edat
}

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

    // Tutor legal (obligatori si menor de 18 — validat a superRefine)
    tutor_nom: z.string().optional(),
    tutor_dni: z.string().optional(),
    tutor_relacio: z.enum(['pare_mare', 'tutor_legal', 'altre']).optional(),
    consentiment_tutor: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    // Contrasenyes
    if (d.password !== d.password_confirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Les contrasenyes no coincideixen.',
        path: ['password_confirm'],
      })
    }

    // Tutor legal si menor de 18
    if (d.data_naixement && calcularEdat(d.data_naixement) < 18) {
      if (!d.tutor_nom?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El nom complet del representant és obligatori.', path: ['tutor_nom'] })
      }
      if (!d.tutor_dni?.trim() || !validarDNI(d.tutor_dni)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El DNI/NIE del representant no és vàlid.', path: ['tutor_dni'] })
      }
      if (!d.tutor_relacio) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La relació amb el menor és obligatòria.', path: ['tutor_relacio'] })
      }
      if (d.consentiment_tutor !== 'on') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Cal el consentiment del representant legal.', path: ['consentiment_tutor'] })
      }
    }
  })

export type RegistreInput = z.infer<typeof RegistreSchema>
