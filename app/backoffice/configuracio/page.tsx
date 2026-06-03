import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Pencil, Image as ImageIcon, Mail, Users } from 'lucide-react'
import { ConfiguracioGeneralForm } from './_components/configuracio-general-form'
import { EquipsConfigForm } from './_components/equips-config-form'
import { CarnetBuilder } from './_components/carnet-builder'
import type { CarnetElement } from './_components/carnet-builder'

export const metadata: Metadata = { title: 'Configuració' }

const VARIABLES_PER_PLANTILLA: Record<string, string[]> = {
  confirmacio_registre: ['{{nom}}', '{{email}}', '{{url_portal}}'],
  confirmacio_pagament: ['{{nom}}', '{{numero_membre}}', '{{url_carnet}}'],
  nou_event: ['{{nom}}', '{{titol_event}}', '{{data_event}}', '{{lloc}}', '{{url_events}}'],
  inscripcio_aprovada: ['{{nom}}', '{{nom_jugador}}', '{{equip}}', '{{temporada}}', '{{import}}', '{{url_pagament}}'],
  inscripcio_denegada: ['{{nom}}', '{{nom_jugador}}', '{{equip}}', '{{motiu}}'],
}

export default async function ConfiguracioPage() {
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

  // Configuració general
  const { data: configRows } = await serviceSupabase
    .from('configuracio')
    .select('clau, valor')

  const config: Record<string, string | null> = {}
  for (const row of configRows ?? []) {
    config[row.clau] = row.valor
  }

  // Layout carnet
  let carnetLayout: CarnetElement[] = []
  try {
    if (config['carnet_layout']) {
      carnetLayout = JSON.parse(config['carnet_layout']) as CarnetElement[]
    }
  } catch {
    carnetLayout = []
  }

  // Plantilles
  const { data: plantilles } = await serviceSupabase
    .from('email_templates')
    .select('id, nom, assumpte, updated_at')
    .order('id')

  // Equips actius
  const { data: equips } = await serviceSupabase
    .from('equips')
    .select('id, nom, slug, temporada, preu_inscripcio, soci_automatic')
    .eq('actiu', true)
    .order('nom')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuració</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ajustos generals, quotes per equip i plantilles de correu.
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general" className="gap-1.5">
            <ImageIcon className="size-3.5" />
            Carnet
          </TabsTrigger>
          <TabsTrigger value="equips" className="gap-1.5">
            <Users className="size-3.5" />
            Equips
          </TabsTrigger>
          <TabsTrigger value="plantilles" className="gap-1.5">
            <Mail className="size-3.5" />
            Plantilles de correu
          </TabsTrigger>
        </TabsList>

        {/* ── Tab Carnet ──────────────────────────────── */}
        <TabsContent value="general" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Imatge de fons</CardTitle>
              <CardDescription>
                Puja una imatge de fons per al carnet. Deixa buit per usar el gradient taronja per defecte.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConfiguracioGeneralForm carnetFonsUrl={config['carnet_fons_url'] ?? ''} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Disseny del carnet</CardTitle>
              <CardDescription>
                Arrossega camps dinàmics i text lliure per configurar el contingut i la posició
                de cada element al carnet de soci.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CarnetBuilder
                initialElements={carnetLayout}
                fonsUrl={config['carnet_fons_url']}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab Equips ──────────────────────────────── */}
        <TabsContent value="equips" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quotes i soci automàtic per equip</CardTitle>
              <CardDescription>
                Configura el preu d&apos;inscripció de cada equip. Si marqueu &quot;Soci
                automàtic&quot;, els jugadors s&apos;activen directament en ser aprovats sense
                necessitat de pagament.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EquipsConfigForm equips={equips ?? []} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab Plantilles ──────────────────────────── */}
        <TabsContent value="plantilles" className="mt-4 space-y-4">
          {!plantilles || plantilles.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                No hi ha plantilles configurades. Executa la migració SQL per crear-les.
              </CardContent>
            </Card>
          ) : (
            plantilles.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{p.nom}</p>
                        <Badge variant="outline" className="font-mono text-xs">
                          {p.id}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        Assumpte: {p.assumpte}
                      </p>
                      {VARIABLES_PER_PLANTILLA[p.id] && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {VARIABLES_PER_PLANTILLA[p.id].map((v) => (
                            <Badge key={v} variant="secondary" className="font-mono text-xs">
                              {v}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {p.updated_at && (
                        <p className="text-xs text-muted-foreground">
                          Darrera edició:{' '}
                          {new Intl.DateTimeFormat('ca-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }).format(new Date(p.updated_at))}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/backoffice/configuracio/plantilles/${p.id}`}
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'shrink-0 gap-1.5')}
                    >
                      <Pencil className="size-3.5" />
                      Editar
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
