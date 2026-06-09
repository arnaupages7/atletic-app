import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Política de privacitat' }

export default async function PrivacitatPage() {
  const supabase = await createServiceClient()
  const { data } = await supabase
    .from('configuracio')
    .select('valor')
    .eq('clau', 'url_privacitat')
    .single()

  if (data?.valor) {
    redirect(data.valor)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-3">
        <h1 className="text-xl font-semibold">Política de privacitat</h1>
        <p className="text-muted-foreground text-sm">
          El document de política de privacitat encara no ha estat configurat pel club.
          Si us plau, contacteu amb l&apos;administrador.
        </p>
      </div>
    </div>
  )
}
