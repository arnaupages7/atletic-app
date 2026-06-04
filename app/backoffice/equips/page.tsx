import type { Metadata } from 'next'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Plus, Pencil, Users } from 'lucide-react'
import { PreparaTemporadaForm } from './_components/prepara-temporada-form'

export const metadata: Metadata = { title: 'Equips' }

export default async function EquipsPage() {
  const supabase = await createServiceClient()

  // Temporada activa
  const { data: temporadaRow } = await supabase
    .from('configuracio')
    .select('valor')
    .eq('clau', 'temporada_activa')
    .single()
  const temporadaActiva = (temporadaRow as { valor: string | null } | null)?.valor ?? '2025-26'

  // Equips de la temporada activa
  const { data: equips } = await supabase
    .from('equips')
    .select('id, nom, slug, categoria, temporada, preu_inscripcio, soci_automatic, actiu, places_disponibles')
    .eq('temporada', temporadaActiva)
    .order('nom')

  // Comptador jugadors actius per equip (temporada activa)
  const { data: comptadors } = await supabase
    .from('jugadors')
    .select('equip_id')
    .in('estat', ['actiu', 'pendent_aprovacio', 'pendent_pagament'])
    .eq('temporada', temporadaActiva)

  const jugadorsPerEquip: Record<string, number> = {}
  for (const j of comptadors ?? []) {
    if (j.equip_id) jugadorsPerEquip[j.equip_id] = (jugadorsPerEquip[j.equip_id] ?? 0) + 1
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Equips</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Equips de la temporada <strong>{temporadaActiva}</strong>.
          </p>
        </div>
        <Link
          href="/backoffice/equips/nou"
          className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5 shrink-0')}
        >
          <Plus className="size-4" />
          Nou equip
        </Link>
      </div>

      {/* Taula */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Equip</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Categoria</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Preu</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Jugadors</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Places</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Soci auto.</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Estat</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {!equips || equips.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    No hi ha equips per a la temporada {temporadaActiva}.{' '}
                    <Link href="/backoffice/equips/nou" className="underline underline-offset-4">
                      Afegeix el primer equip
                    </Link>{' '}
                    o prepara la temporada des de baix.
                  </td>
                </tr>
              ) : (
                equips.map((equip) => {
                  const nJugadors = jugadorsPerEquip[equip.id] ?? 0
                  return (
                    <tr key={equip.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium">{equip.nom}</span>
                          <Badge variant="outline" className="font-mono text-xs hidden sm:inline-flex">
                            {equip.slug}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">
                        {equip.categoria ?? <span className="italic">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">
                        {equip.preu_inscripcio != null
                          ? `${(equip.preu_inscripcio / 100).toFixed(0)} €`
                          : <span className="italic text-xs">per defecte</span>}
                      </td>
                      <td className="px-4 py-3 text-center hidden md:table-cell">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Users className="size-3.5" />
                          {nJugadors}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground hidden lg:table-cell">
                        {equip.places_disponibles != null ? equip.places_disponibles : '∞'}
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        {equip.soci_automatic
                          ? <span className="text-xs text-green-600 font-medium">Sí</span>
                          : <span className="text-xs text-muted-foreground">No</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {equip.actiu ? (
                          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-xs">
                            Actiu
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-xs">
                            Inactiu
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/backoffice/equips/${equip.id}/editar`}
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

      {/* Preparar nova temporada */}
      <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
        <div>
          <p className="text-sm font-semibold">Preparar nova temporada</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Clona tots els equips actius a una nova temporada amb un clic. Pots marcar
            &quot;Actualitzar temporada activa&quot; per canviar-la automàticament. Els equips de
            la temporada anterior i els jugadors existents no es veuen afectats.
          </p>
        </div>
        <PreparaTemporadaForm temporadaActiva={temporadaActiva} equips={equips ?? []} />
      </div>
    </div>
  )
}
