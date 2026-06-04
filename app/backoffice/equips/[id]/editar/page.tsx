import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EditarEquipForm } from './_components/editar-equip-form'

export const metadata: Metadata = { title: 'Editar equip' }

export default async function EditarEquipPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data: equip } = await supabase
    .from('equips')
    .select('id, nom, slug, categoria, temporada, preu_inscripcio, soci_automatic, places_disponibles, actiu')
    .eq('id', id)
    .single()

  if (!equip) notFound()

  return (
    <div className="max-w-lg space-y-6">
      <Link
        href="/backoffice/equips"
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2')}
      >
        <ChevronLeft className="size-4" />
        Tornar als equips
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Editar equip</CardTitle>
          <CardDescription>
            {equip.nom} — temporada <strong>{equip.temporada}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditarEquipForm
            equipId={equip.id}
            defaults={{
              nom: equip.nom,
              slug: equip.slug,
              categoria: equip.categoria,
              preu_inscripcio: equip.preu_inscripcio,
              places_disponibles: equip.places_disponibles,
              soci_automatic: equip.soci_automatic,
              actiu: equip.actiu,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
