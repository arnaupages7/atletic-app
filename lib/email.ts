import { createServiceClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend'

export function substituirVariables(text: string, variables: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`)
}

// ── Enviar email individual ───────────────────────────────────────────────────

export async function enviarEmail({
  templateId,
  to,
  variables,
}: {
  templateId: string
  to: string
  variables: Record<string, string>
}): Promise<void> {
  try {
    const supabase = await createServiceClient()

    const { data: template } = await supabase
      .from('email_templates')
      .select('assumpte, cos_html')
      .eq('id', templateId)
      .single()

    if (!template) {
      console.error(`[email] Template no trobat: ${templateId}`)
      return
    }

    const assumpte = substituirVariables(template.assumpte, variables)
    const cosHtml = substituirVariables(template.cos_html, variables)

    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'Atlètic Club Banyoles <no-reply@atleticbanyoles.cat>',
      to,
      subject: assumpte,
      html: cosHtml,
    })

    if (error) {
      console.error('[email] Error enviant email:', error)
    }
  } catch (err) {
    console.error('[email] Error inesperat:', err)
  }
}

// ── Enviar email massiu (batch) ───────────────────────────────────────────────

export async function enviarEmailMassiu({
  templateId,
  destinataris,
  variablesComunes,
}: {
  templateId: string
  /** Array de { email, variablesPersonals } */
  destinataris: { email: string; variablesPersonals: Record<string, string> }[]
  /** Variables compartides per tots els destinataris */
  variablesComunes?: Record<string, string>
}): Promise<void> {
  if (destinataris.length === 0) return

  try {
    const supabase = await createServiceClient()

    const { data: template } = await supabase
      .from('email_templates')
      .select('assumpte, cos_html')
      .eq('id', templateId)
      .single()

    if (!template) {
      console.error(`[email] Template no trobat: ${templateId}`)
      return
    }

    const from = process.env.EMAIL_FROM ?? 'Atlètic Club Banyoles <no-reply@atleticbanyoles.cat>'
    const CHUNK = 100

    for (let i = 0; i < destinataris.length; i += CHUNK) {
      const chunk = destinataris.slice(i, i + CHUNK)
      const missatges = chunk.map(({ email, variablesPersonals }) => {
        const vars = { ...variablesComunes, ...variablesPersonals }
        return {
          from,
          to: email,
          subject: substituirVariables(template.assumpte, vars),
          html: substituirVariables(template.cos_html, vars),
        }
      })
      const { error } = await resend.batch.send(missatges)
      if (error) console.error('[email] Error batch:', error)
    }
  } catch (err) {
    console.error('[email] Error inesperat massiu:', err)
  }
}
