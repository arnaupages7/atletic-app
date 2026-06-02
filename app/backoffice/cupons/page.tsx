import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PlusCircle, Ticket } from 'lucide-react'
import { CupoToggle } from './_components/cupo-toggle'

export const metadata: Metadata = { title: 'Cupons' }

export default async function CuponsPage() {
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

  const { data: cupons } = await serviceSupabase
    .from('cupons')
    .select('id, codi, descripcio, tipus, valor, usos_maxims, usos_actuals, actiu, data_expiracio, created_at')
    .order('created_at', { ascending: false })

  const formatValor = (tipus: string, valor: number) =>
    tipus === 'percentatge' ? `${valor}%` : `${(valor / 100).toFixed(2)} €`

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cupons</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Codis de descompte per a quotes de soci i inscripcions de jugadors.
          </p>
        </div>
        <Link
          href="/backoffice/cupons/nou"
          className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5 shrink-0')}
        >
          <PlusCircle className="size-4" />
          Nou cupó
        </Link>
      </div>

      {(!cupons || cupons.length === 0) ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <Ticket className="size-8 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No hi ha cupons creats.</p>
          <Link
            href="/backoffice/cupons/nou"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-4')}
          >
            Crear el primer cupó
          </Link>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Codi</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                    Descripció
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Descompte
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                    Usos
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                    Expira
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estat</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {cupons.map((c) => {
                  const esgotat =
                    c.usos_maxims !== null && c.usos_actuals >= c.usos_maxims
                  const expirat =
                    c.data_expiracio && new Date(c.data_expiracio) < new Date()

                  return (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold tracking-wide">{c.codi}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell max-w-xs truncate">
                        {c.descripcio ?? '—'}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {formatValor(c.tipus, c.valor)}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({c.tipus === 'percentatge' ? '%' : '€ fix'})
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={cn(
                            'font-medium tabular-nums',
                            esgotat && 'text-destructive'
                          )}
                        >
                          {c.usos_actuals}
                          {c.usos_maxims !== null && (
                            <span className="text-muted-foreground font-normal">
                              /{c.usos_maxims}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                        {c.data_expiracio
                          ? new Intl.DateTimeFormat('ca-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            }).format(new Date(c.data_expiracio))
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {!c.actiu ? (
                          <Badge variant="secondary">Inactiu</Badge>
                        ) : esgotat ? (
                          <Badge variant="destructive">Esgotat</Badge>
                        ) : expirat ? (
                          <Badge variant="destructive">Expirat</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">
                            Actiu
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <CupoToggle id={c.id} actiu={c.actiu} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
