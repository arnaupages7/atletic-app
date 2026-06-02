import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CupoForm } from './_components/cupo-form'

export const metadata: Metadata = { title: 'Nou cupó' }

export default async function NouCupoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceSupabase = await createServiceClient()
  const { data: gestor } = await serviceSupabase
    .from('gestors')
    .select('id')
    .eq('user_id', user.id)
    .eq('actiu', true)
    .single()
  if (!gestor) redirect('/backoffice')

  return (
    <div className="space-y-6 max-w-lg">
      <div className="space-y-1">
        <Link
          href="/backoffice/cupons"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2')}
        >
          <ChevronLeft className="size-4" />
          Cupons
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Nou cupó</h1>
        <p className="text-muted-foreground text-sm">
          Crea un codi de descompte per a socis o jugadors.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dades del cupó</CardTitle>
          <CardDescription>
            El cupó es crearà a Stripe automàticament i s&apos;aplicarà al primer pagament.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CupoForm />
        </CardContent>
      </Card>
    </div>
  )
}
