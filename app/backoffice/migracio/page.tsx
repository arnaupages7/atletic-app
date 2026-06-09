import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ImportarForm } from './_components/importar-form'
import { SequenciaForm, EsborrarPendentsForm } from './_components/sequencia-form'
import { CheckCircle2, Clock, Users } from 'lucide-react'

export const metadata: Metadata = { title: 'Migració números de soci' }

export default async function MigracioPage() {
  const supabase = await createServiceClient()

  // Stats
  const [{ count: total }, { count: assignats }, { count: pendents }] = await Promise.all([
    supabase.from('migracio_socis').select('*', { count: 'exact', head: true }),
    supabase.from('migracio_socis').select('*', { count: 'exact', head: true }).eq('assignat', true),
    supabase.from('migracio_socis').select('*', { count: 'exact', head: true }).eq('assignat', false),
  ])

  // Número màxim reservat (per suggerir seqüència) + valor desat a configuració
  const [{ data: maxRow }, { data: configSeq }] = await Promise.all([
    supabase
      .from('migracio_socis')
      .select('numero_membre')
      .order('numero_membre', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('configuracio')
      .select('valor')
      .eq('clau', 'sequencia_inici_socis')
      .maybeSingle(),
  ])

  const maxReservat = maxRow?.numero_membre ?? 0
  const sequenciaDesada = configSeq?.valor ? parseInt(configSeq.valor) : null

  // Últims registres (taula)
  const { data: registres } = await supabase
    .from('migracio_socis')
    .select('dni, numero_membre, nom, cognom1, assignat, assignat_at')
    .order('numero_membre', { ascending: true })
    .limit(100)

  const stats = [
    { label: 'Total importats', value: total ?? 0, icon: Users, color: 'text-blue-600' },
    { label: 'Ja assignats', value: assignats ?? 0, icon: CheckCircle2, color: 'text-green-600' },
    { label: 'Pendents', value: pendents ?? 0, icon: Clock, color: 'text-amber-600' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Migració números de soci</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Importa el llistat de socis existents per preservar els seus números en el nou portal.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <s.icon className={`size-5 shrink-0 ${s.color}`} />
                <div>
                  <p className="text-2xl font-bold font-mono">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Importar CSV */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Importar dades del sistema antic</CardTitle>
            <CardDescription>
              Copia les columnes DNI i Núm. Soci des d&apos;Excel i enganxa-les aquí.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImportarForm />
          </CardContent>
        </Card>

        {/* Configuració seqüència */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">2. Numeració per als nous socis</CardTitle>
              <CardDescription>
                Defineix des de quin número comencen els socis que no estiguin a la taula de migració.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SequenciaForm maxReservat={maxReservat} sequenciaDesada={sequenciaDesada} />
            </CardContent>
          </Card>

          {(pendents ?? 0) > 0 && (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base text-muted-foreground">Netejar registres pendents</CardTitle>
                <CardDescription>
                  Si un soci no es registrarà al portal, pots eliminar el registre de migració corresponent.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EsborrarPendentsForm pendents={pendents ?? 0} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Taula de registres */}
      {(registres?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Registres importats
              {(total ?? 0) > 100 && (
                <span className="text-xs font-normal text-muted-foreground ml-2">
                  (mostrant els primers 100 de {total})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">#</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">DNI</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Nom</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estat</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {registres!.map((r) => (
                  <tr key={r.dni} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-mono text-muted-foreground">{r.numero_membre}</td>
                    <td className="px-4 py-2.5 font-mono">{r.dni}</td>
                    <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">
                      {r.nom || r.cognom1
                        ? `${r.nom ?? ''} ${r.cognom1 ?? ''}`.trim()
                        : <span className="italic">—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      {r.assignat ? (
                        <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 dark:bg-green-950/20">
                          Assignat
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-950/20">
                          Pendent
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
