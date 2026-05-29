import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserCheck, Clock, Euro } from 'lucide-react'

export const metadata: Metadata = { title: 'Dashboard' }

const fmt = new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' })

export default async function BackofficePage() {
  const supabase = await createServiceClient()

  // KPIs en paral·lel
  const [
    { count: socisActius },
    { count: socisTotal },
    { count: jugadorsActius },
    { count: solicitudsPendents },
    { data: pagamentsMes },
  ] = await Promise.all([
    supabase
      .from('socis')
      .select('id', { count: 'exact', head: true })
      .eq('estat', 'actiu'),
    supabase
      .from('socis')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('jugadors')
      .select('id', { count: 'exact', head: true })
      .eq('estat', 'actiu'),
    supabase
      .from('jugadors')
      .select('id', { count: 'exact', head: true })
      .eq('estat', 'pendent_aprovacio'),
    supabase
      .from('pagaments')
      .select('import')
      .eq('estat', 'completat')
      .gte(
        'created_at',
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      ),
  ])

  const ingressosMes = (pagamentsMes ?? []).reduce((acc, p) => acc + Number(p.import), 0)

  // Sol·licituds recents
  const { data: solRecents } = await supabase
    .from('jugadors')
    .select(`
      id,
      estat,
      created_at,
      membres!inner(nom, cognom1),
      equips(nom)
    `)
    .eq('estat', 'pendent_aprovacio')
    .order('created_at', { ascending: false })
    .limit(5)

  const kpis = [
    {
      label: 'Socis actius',
      value: socisActius ?? 0,
      sub: `de ${socisTotal ?? 0} totals`,
      icon: Users,
      color: 'text-blue-500',
    },
    {
      label: 'Jugadors actius',
      value: jugadorsActius ?? 0,
      sub: 'temporada 2025-26',
      icon: UserCheck,
      color: 'text-green-500',
    },
    {
      label: 'Sol·licituds pendents',
      value: solicitudsPendents ?? 0,
      sub: 'pendent d\'aprovació',
      icon: Clock,
      color: solicitudsPendents ? 'text-orange-500' : 'text-muted-foreground',
    },
    {
      label: 'Ingressos mes actual',
      value: fmt.format(ingressosMes / 100),
      sub: new Intl.DateTimeFormat('ca-ES', { month: 'long', year: 'numeric' }).format(new Date()),
      icon: Euro,
      color: 'text-violet-500',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Resum de l&apos;activitat de l&apos;Atlètic Club Banyoles.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className={`size-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sol·licituds recents */}
      {solRecents && solRecents.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Sol·licituds pendents d&apos;aprovació
          </h2>
          <Card>
            <div className="divide-y">
              {solRecents.map((s) => {
                const m = s.membres as unknown as { nom: string; cognom1: string } | null
                const e = s.equips as unknown as { nom: string } | null
                return (
                  <a
                    key={s.id}
                    href={`/backoffice/jugadors/${s.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {m ? `${m.nom} ${m.cognom1}` : '—'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {e?.nom ?? 'Equip desconegut'}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat('ca-ES', {
                        day: 'numeric',
                        month: 'short',
                      }).format(new Date(s.created_at))}
                    </span>
                  </a>
                )
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
