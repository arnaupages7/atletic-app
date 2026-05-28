import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Plus, Lock, Globe, Eye, EyeOff, Pencil } from 'lucide-react'

export const metadata: Metadata = { title: 'Events' }

export default async function BackofficeEventsPage() {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select('id, titol, data_inici, data_fi, lloc, exclusiu_socis, publicat, created_at')
    .order('data_inici', { ascending: false })

  const avui = new Date()
  avui.setHours(0, 0, 0, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {events?.length ?? 0} event{events?.length !== 1 ? 's' : ''} en total
          </p>
        </div>
        <Link
          href="/backoffice/events/nou"
          className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'gap-1.5')}
        >
          <Plus className="size-4" />
          Nou event
        </Link>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Títol</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Data</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Lloc</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Visibilitat</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estat</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(!events || events.length === 0) ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No hi ha events. Crea el primer!
                  </td>
                </tr>
              ) : (
                events.map((ev) => {
                  const dataInici = new Date(ev.data_inici)
                  const esPast = dataInici < avui
                  return (
                    <tr key={ev.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        <span className={cn(esPast && 'text-muted-foreground')}>{ev.titol}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">
                        {new Intl.DateTimeFormat('ca-ES', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        }).format(dataInici)}
                        {ev.data_fi && (
                          <span>
                            {' '}→{' '}
                            {new Intl.DateTimeFormat('ca-ES', {
                              day: 'numeric', month: 'short',
                            }).format(new Date(ev.data_fi))}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-sm">
                        {ev.lloc ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        {ev.exclusiu_socis ? (
                          <span className="flex items-center gap-1 text-xs text-amber-700">
                            <Lock className="size-3" /> Socis
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Globe className="size-3" /> Públic
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {ev.publicat ? (
                          <span className="flex items-center gap-1 text-xs text-green-700">
                            <Eye className="size-3" /> Publicat
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <EyeOff className="size-3" /> Esborrany
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/backoffice/events/${ev.id}/editar`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline underline-offset-4"
                        >
                          <Pencil className="size-3" />
                          Editar
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
