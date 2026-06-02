import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Users, Calendar, CreditCard, ChevronRight, AlertCircle, IdCard } from 'lucide-react'
import { PagarQuotaForm } from './_components/pagar-quota-form'

export const metadata: Metadata = { title: 'Inici' }

export default async function PortalPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Dades del soci + membre
  const { data: soci } = await supabase
    .from('socis')
    .select('id, estat, data_alta')
    .eq('user_id', user.id)
    .single()

  if (!soci) redirect('/login')

  const { data: membre } = await supabase
    .from('membres')
    .select('nom, cognom1, numero_membre')
    .eq('id', soci.id)
    .single()

  // Jugadors del soci
  const { data: jugadors } = await supabase
    .from('jugadors')
    .select('id, estat')
    .eq('soci_responsable_id', soci.id)

  // Darrer pagament
  const { data: darrersPagements } = await supabase
    .from('pagaments')
    .select('concepte, import, estat, created_at')
    .eq('membre_id', soci.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const jugadorsActius = jugadors?.filter((j) => j.estat === 'actiu').length ?? 0
  const jugadorsPendents = jugadors?.filter((j) =>
    ['pendent_aprovacio', 'pendent_pagament'].includes(j.estat)
  ).length ?? 0

  const accions = [
    {
      href: '/portal/jugadors',
      icon: Users,
      label: 'Els meus jugadors',
      descripcio: jugadorsActius > 0 ? `${jugadorsActius} actiu${jugadorsActius !== 1 ? 's' : ''}` : 'Cap jugador inscrit',
    },
    {
      href: '/portal/events',
      icon: Calendar,
      label: 'Events i partits',
      descripcio: 'Partits en directe, activitats i actes del club',
    },
    {
      href: '/portal/pagaments',
      icon: CreditCard,
      label: 'Pagaments',
      descripcio: darrersPagements?.[0]
        ? `Darrer: ${new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(darrersPagements[0].import / 100)}`
        : 'Sense pagaments',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Capçalera */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hola, {membre?.nom}!
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Benvingut al teu portal de soci de l&apos;Atlètic Club Banyoles.
        </p>
      </div>

      {/* Avís si pendent de pagament */}
      {soci.estat === 'pendent_pagament' && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Quota de soci pendent
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                El teu registre és complet però el pagament de la quota anual (25€) encara no
                s&apos;ha processat. Fes clic a &quot;Paga ara&quot; per completar l&apos;alta.
              </p>
              <PagarQuotaForm />
            </div>
          </div>
        </div>
      )}

      {/* Carnet digital */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium opacity-70 uppercase tracking-wide">
                Atlètic Club Banyoles
              </p>
              <p className="text-xl font-bold">
                {membre?.nom} {membre?.cognom1}
              </p>
              {soci.data_alta && (
                <p className="text-xs opacity-60">
                  Soci des de{' '}
                  {new Intl.DateTimeFormat('ca-ES', {
                    year: 'numeric',
                    month: 'long',
                  }).format(new Date(soci.data_alta))}
                </p>
              )}
            </div>
            <div className="text-right space-y-1">
              <p className="text-3xl font-bold tracking-tight tabular-nums">
                #{membre?.numero_membre}
              </p>
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full font-medium',
                soci.estat === 'actiu' && 'bg-green-500/20 text-green-200',
                soci.estat === 'pendent_pagament' && 'bg-yellow-500/20 text-yellow-200',
                soci.estat === 'baixa' && 'bg-red-500/20 text-red-200',
              )}>
                {soci.estat === 'actiu' ? 'Actiu' : soci.estat === 'pendent_pagament' ? 'Pendent' : 'Baixa'}
              </span>
            </div>
          </div>
          {soci.estat === 'actiu' && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <Link
                href="/portal/carnet"
                className={cn(
                  buttonVariants({ variant: 'secondary', size: 'sm' }),
                  'gap-1.5 bg-white/15 hover:bg-white/25 text-white border-0'
                )}
              >
                <IdCard className="size-3.5" />
                Veure i imprimir carnet
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resum jugadors pendents */}
      {jugadorsPendents > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
          <div className="flex items-center gap-3">
            <Users className="size-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              {jugadorsPendents} inscripció{jugadorsPendents !== 1 ? 's' : ''} de jugador en curs
            </p>
          </div>
          <Link
            href="/portal/jugadors"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'shrink-0')}
          >
            Veure
          </Link>
        </div>
      )}

      {/* Accions ràpides */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Seccions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {accions.map(({ href, icon: Icon, label, descripcio }) => (
            <Link key={href} href={href}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <Icon className="size-4 text-muted-foreground" />
                      {label}
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription className="text-xs">{descripcio}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
