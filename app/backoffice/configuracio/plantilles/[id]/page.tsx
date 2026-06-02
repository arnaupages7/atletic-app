import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PlantillaForm } from './_components/plantilla-form'

export const metadata: Metadata = { title: 'Editar plantilla' }

const VARIABLES_PER_PLANTILLA: Record<string, { variable: string; descripcio: string }[]> = {
  confirmacio_registre: [
    { variable: '{{nom}}', descripcio: 'Nom del soci' },
    { variable: '{{email}}', descripcio: 'Adreça de correu' },
    { variable: '{{url_portal}}', descripcio: 'Enllaç al portal de soci' },
  ],
  confirmacio_pagament: [
    { variable: '{{nom}}', descripcio: 'Nom del soci' },
    { variable: '{{numero_membre}}', descripcio: 'Número de soci' },
    { variable: '{{url_carnet}}', descripcio: 'Enllaç al carnet digital' },
  ],
}

export default async function PlantillaEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceSupabase = await createServiceClient()

  const { data: gestorActual } = await serviceSupabase
    .from('gestors')
    .select('rol')
    .eq('user_id', user.id)
    .eq('actiu', true)
    .single()
  if (!gestorActual || gestorActual.rol !== 'admin') redirect('/backoffice')

  const { data: plantilla } = await serviceSupabase
    .from('email_templates')
    .select('id, nom, assumpte, cos_html')
    .eq('id', id)
    .single()

  if (!plantilla) notFound()

  const variables = VARIABLES_PER_PLANTILLA[id] ?? []

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="space-y-1">
        <Link
          href="/backoffice/configuracio"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2')}
        >
          <ChevronLeft className="size-4" />
          Tornar a Configuració
        </Link>
        <div className="flex items-center gap-2 mt-1">
          <h1 className="text-2xl font-semibold tracking-tight">{plantilla.nom}</h1>
          <Badge variant="outline" className="font-mono text-xs">
            {plantilla.id}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">Edita l&apos;assumpte i el cos HTML de la plantilla.</p>
      </div>

      {variables.length > 0 && (
        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Variables disponibles</CardTitle>
            <CardDescription className="text-xs">
              Afegeix-les al text per personalitzar cada correu automàticament.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex flex-col gap-1.5">
              {variables.map(({ variable, descripcio }) => (
                <div key={variable} className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary" className="font-mono text-xs shrink-0">
                    {variable}
                  </Badge>
                  <span className="text-muted-foreground text-xs">{descripcio}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <PlantillaForm
            id={plantilla.id}
            assumpte={plantilla.assumpte}
            cosHtml={plantilla.cos_html}
          />
        </CardContent>
      </Card>
    </div>
  )
}
