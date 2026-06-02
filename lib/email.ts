import { createServiceClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend'

function substituirVariables(text: string, variables: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`)
}

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
