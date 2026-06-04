import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { InscripcioForm } from './inscripcio-form'
import { buttonVariants } from '@/components/ui/button'
import { ChevronLeft, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Inscriure jugador' }

export default async function NouJugadorPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verificar que el soci és actiu
  const { data: soci } = await supabase
    .from('socis')
    .select('id, estat')
    .eq('user_id', user.id)
    .single()

  if (!soci) redirect('/login')

  // Si no és actiu, mostrar avís
  if (soci.estat !== 'actiu') {
    return (
      <div className="space-y-6">
        <Link
          href="/portal/jugadors"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2')}
        >
          <ChevronLeft className="size-4" />
          Tornar
        </Link>
        <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950/30">
          <AlertCircle className="size-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Cal tenir la quota de soci al dia
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              Per inscriure jugadors al futbol base, has de tenir l&apos;estat de soci{' '}
              <strong>actiu</strong>. Contacta amb el club a{' '}
              <a href="mailto:administracio@atletic.cat" className="underline">
                administracio@atletic.cat
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Temporada activa des de la configuració
  const serviceSupabase = await createServiceClient()
  const { data: temporadaRow } = await serviceSupabase
    .from('configuracio')
    .select('valor')
    .eq('clau', 'temporada_activa')
    .single()
  const temporadaActiva = temporadaRow?.valor ?? '2025-26'

  // Carregar equips disponibles de la temporada activa
  const { data: equips } = await supabase
    .from('equips')
    .select('id, nom, places_disponibles')
    .eq('actiu', true)
    .eq('temporada', temporadaActiva)
    .order('nom', { ascending: true })

  // Comptar jugadors actius del soci (per detectar descompte germà)
  const { count: jugadorsActius } = await supabase
    .from('jugadors')
    .select('id', { count: 'exact', head: true })
    .eq('soci_responsable_id', soci.id)
    .eq('estat', 'actiu')

  const teGermaActiu = (jugadorsActius ?? 0) > 0

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Capçalera */}
      <div className="space-y-1">
        <Link
          href="/portal/jugadors"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 mb-2')}
        >
          <ChevronLeft className="size-4" />
          Els meus jugadors
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Inscriure un jugador</h1>
        <p className="text-muted-foreground text-sm">
          Omple el formulari per inscriure el jugador al futbol base de l&apos;Atlètic Club
          Banyoles — temporada {temporadaActiva}.
        </p>
      </div>

      {/* Avís descompte germà */}
      {teGermaActiu && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
          S&apos;aplicarà el <strong>descompte de germà/na (−25 €)</strong> a la
          quota d&apos;aquest jugador ja que tens un altre jugador actiu al club.
        </div>
      )}

      {/* Formulari */}
      <InscripcioForm equips={equips ?? []} />
    </div>
  )
}
