import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { EditarCupoForm } from './_components/editar-cupo-form'

export const metadata: Metadata = { title: 'Editar cupó' }

export default async function EditarCupoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

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

  const { data: cupo } = await serviceSupabase
    .from('cupons')
    .select('id, codi, tipus, valor, descripcio, usos_maxims, usos_actuals, data_expiracio, aplicable_a, equip_id')
    .eq('id', id)
    .single()

  if (!cupo) notFound()

  const { data: equips } = await serviceSupabase
    .from('equips')
    .select('id, nom')
    .eq('actiu', true)
    .order('nom')

  const formatValor = (tipus: string, valor: number) =>
    tipus === 'percentatge' ? `${valor}%` : `${(valor / 100).toFixed(2)} €`

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
        <h1 className="text-2xl font-semibold tracking-tight">
          Editar cupó{' '}
          <span className="font-mono text-primary">{cupo.codi}</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          Descompte:{' '}
          <strong>{formatValor(cupo.tipus, cupo.valor)}</strong> ·{' '}
          {cupo.usos_actuals} usos realitzats
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Editar cupó</CardTitle>
          <CardDescription>
            El codi, tipus i valor no es poden modificar un cop creat a Stripe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditarCupoForm
            cupoId={cupo.id}
            defaults={{
              descripcio: cupo.descripcio,
              usos_maxims: cupo.usos_maxims,
              data_expiracio: cupo.data_expiracio,
              aplicable_a: cupo.aplicable_a as 'soci' | 'jugador' | 'tots',
              equip_id: cupo.equip_id,
            }}
            equips={equips ?? []}
          />
        </CardContent>
      </Card>
    </div>
  )
}
