import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend'

export async function GET(req: NextRequest) {
  // Requereix autenticació d'admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticat' }, { status: 401 })

  const serviceSupabase = await createServiceClient()
  const { data: gestor } = await serviceSupabase
    .from('gestors')
    .select('rol')
    .eq('user_id', user.id)
    .eq('actiu', true)
    .single()
  if (!gestor || gestor.rol !== 'admin') {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 403 })
  }

  // Destinatari: ?to=email@exemple.com  (o el correu de l'admin per defecte)
  const to = req.nextUrl.searchParams.get('to') ?? user.email!

  const { data, error } = await resend.emails.send({
    from: 'Atlètic Club Banyoles <no-reply@atleticbanyoles.cat>',
    to,
    subject: 'Correu de prova — Atlètic Club Banyoles',
    html: `
      <p>Hola,</p>
      <p>Aquest és un <strong>correu de prova</strong> enviat des de l'app de l'Atlètic Club Banyoles.</p>
      <p>Si reps aquest missatge, la integració amb Resend funciona correctament ✅</p>
      <hr />
      <p style="color:#999;font-size:12px;">Enviat el ${new Date().toLocaleString('ca-ES')}</p>
    `,
  })

  if (error) {
    return NextResponse.json({ ok: false, error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, emailId: data?.id, to })
}
