import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Pencil, Image as ImageIcon, Mail } from 'lucide-react'
import { ConfiguracioGeneralForm } from './_components/configuracio-general-form'

export const metadata: Metadata = { title: 'Configuració' }

const VARIABLES_PER_PLANTILLA: Record<string, string[]> = {
  confirmacio_registre: ['{{nom}}', '{{email}}', '{{url_portal}}'],
  confirmacio_pagament: ['{{nom}}', '{{numero_membre}}', '{{url_carnet}}'],
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

  // Dades configuració
  const { data: configRows } = await serviceSupabase
    .from('configuracio')
    .select('clau, valor')

  const config: Record<string, string | null> = {}
  for (const row of configRows ?? []) {
    config[row.clau] = row.valor
  }

  // Plantilles de correu
  const { data: plantilles } = await serviceSupabase
    .from('email_templates')
    .select('id, nom, assumpte, updated_at')
    .order('id')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuració</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ajustos generals del portal i plantilles de correu electrònic.
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general" className="gap-1.5">
            <ImageIcon className="size-3.5" />
            General
          </TabsTrigger>
          <TabsTrigger value="plantilles" className="gap-1.5">
            <Mail className="size-3.5" />
            Plantilles de correu
          </TabsTrigger>
        </TabsList>

        {/* ── Tab General ─────────────────────────────── */}
        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Carnet digital</CardTitle>
              <CardDescription>
                Imatge de fons del carnet de soci i jugador. Deixa el camp buit per usar el gradient
                predeterminat.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConfiguracioGeneralForm carnetFonsUrl={config['carnet_fons_url'] ?? ''} />
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
