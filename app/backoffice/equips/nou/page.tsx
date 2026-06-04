import type { Metadata } from 'next'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NouEquipForm } from './_components/nou-equip-form'

export const metadata: Metadata = { title: 'Nou equip' }

export default async function NouEquipPage() {
  const supabase = await createServiceClient()

  const { data: temporadaRow } = await supabase
    .from('configuracio')
    .select('valor')
    .eq('clau', 'temporada_activa')
    .single()
  const temporadaActiva = (temporadaRow as { valor: string | null } | null)?.valor ?? '2025-26'

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
          <CardTitle>Nou equip</CardTitle>
          <CardDescription>
            Crea un nou equip per a la temporada <strong>{temporadaActiva}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NouEquipForm temporadaActiva={temporadaActiva} />
        </CardContent>
      </Card>
    </div>
  )
}
