import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PlusCircle, ShieldCheck, Shield } from 'lucide-react'
import { GestorActions } from './_components/gestor-actions'

export const metadata: Metadata = { title: 'Gestors' }

export default async function GestorsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceSupabase = await createServiceClient()

  // Verificar que és admin
  const { data: gestorActual } = await serviceSupabase
    .from('gestors')
    .select('id, rol')
    .eq('user_id', user.id)
    .eq('actiu', true)
    .single()

  if (!gestorActual || gestorActual.rol !== 'admin') redirect('/backoffice')

  // Tots els gestors
  const { data: gestors } = await serviceSupabase
    .from('gestors')
    .select('id, nom, email, rol, actiu, created_at')
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gestors</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Usuaris amb accés al backoffice del club.
          </p>
        </div>
        <Link
          href="/backoffice/gestors/nou"
          className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5 shrink-0')}
        >
          <PlusCircle className="size-4" />
          Nou gestor
        </Link>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nom</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rol</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estat</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Alta</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(!gestors || gestors.length === 0) ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No hi ha gestors registrats.
                  </td>
                </tr>
              ) : (
                gestors.map((g) => (
                  <tr key={g.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{g.nom}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{g.email}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                        g.rol === 'admin'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      )}>
                        {g.rol === 'admin'
                          ? <><ShieldCheck className="size-3" /> Admin</>
                          : <><Shield className="size-3" /> Gestor</>
                        }
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        g.actiu
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600'
                      )}>
                        {g.actiu ? 'Actiu' : 'Inactiu'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                      {new Intl.DateTimeFormat('ca-ES', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      }).format(new Date(g.created_at))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <GestorActions
                        gestorId={g.id}
                        actiu={g.actiu}
                        rol={g.rol}
                        esTuMateix={g.id === gestorActual.id}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
