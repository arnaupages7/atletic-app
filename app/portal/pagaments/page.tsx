import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { CreditCard, CheckCircle2, XCircle, Clock, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EstatPagament } from '@/lib/supabase/types'

export const metadata: Metadata = { title: 'Pagaments' }

const ESTAT_CONFIG: Record<EstatPagament, { label: string; icon: React.ElementType; class: string }> = {
  completat: {
    label: 'Completat',
    icon: CheckCircle2,
    class: 'text-green-600 dark:text-green-400',
  },
  pendent: {
    label: 'Pendent',
    icon: Clock,
    class: 'text-yellow-600 dark:text-yellow-400',
  },
  fallat: {
    label: 'Fallit',
    icon: XCircle,
    class: 'text-red-600 dark:text-red-400',
  },
  reemborsat: {
    label: 'Reemborsat',
    icon: RotateCcw,
    class: 'text-muted-foreground',
  },
}

const fmt = new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' })

export default async function PagamentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Obtenir id del soci
  const { data: soci } = await supabase
    .from('socis')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!soci) redirect('/login')

  // Obtenir tots els pagaments (del soci + dels seus jugadors)
  const { data: pagaments } = await supabase
    .from('pagaments')
    .select('id, concepte, import, estat, created_at')
    .eq('membre_id', soci.id)
    .order('created_at', { ascending: false })

  // Total pagat
  const totalPagat =
    pagaments
      ?.filter((p) => p.estat === 'completat')
      .reduce((acc, p) => acc + p.import, 0) ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pagaments</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Historial de quotes i pagaments associats al teu compte.
        </p>
      </div>

      {/* Resum */}
      {pagaments && pagaments.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total pagat</p>
              <p className="text-xl font-bold mt-1">{fmt.format(totalPagat / 100)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Pagaments</p>
              <p className="text-xl font-bold mt-1">{pagaments.length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Llistat */}
      {(!pagaments || pagaments.length === 0) ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <CreditCard className="size-8 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">Encara no hi ha pagaments registrats.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pagaments.map((pagament) => {
            const cfg = ESTAT_CONFIG[pagament.estat]
            const EstatIcon = cfg.icon

            return (
              <Card key={pagament.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {pagament.concepte === 'quota_soci'
                          ? 'Quota de soci'
                          : pagament.concepte === 'quota_jugador'
                          ? 'Quota futbol base'
                          : pagament.concepte}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Intl.DateTimeFormat('ca-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        }).format(new Date(pagament.created_at))}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={cn('flex items-center gap-1 text-xs font-medium', cfg.class)}>
                        <EstatIcon className="size-3.5" />
                        {cfg.label}
                      </span>
                      <span className="text-sm font-semibold tabular-nums">
                        {fmt.format(pagament.import / 100)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
