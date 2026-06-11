import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { EstatSoci } from '@/lib/supabase/types'
import { ReenviarBenvingudaButton } from './_components/reenviar-benvinguda-button'

export const metadata: Metadata = { title: 'Socis' }

const ESTAT_CLASSES: Record<EstatSoci, string> = {
  actiu: 'bg-green-100 text-green-700',
  pendent_pagament: 'bg-yellow-100 text-yellow-700',
  baixa: 'bg-red-100 text-red-700',
}
const ESTAT_LABELS: Record<EstatSoci, string> = {
  actiu: 'Actiu',
  pendent_pagament: 'Pendent',
  baixa: 'Baixa',
}

export default async function SocisPage({
  searchParams,
}: {
  searchParams: Promise<{ estat?: string; q?: string }>
}) {
  const supabase = await createServiceClient()
  const params = await searchParams
  const filtreEstat = params.estat as EstatSoci | undefined
  const cerca = params.q?.toLowerCase() ?? ''

  // Obtenir socis + membres
  let query = supabase
    .from('socis')
    .select(`
      id,
      estat,
      data_alta,
      membres!inner(nom, cognom1, email, numero_membre)
    `)
    .order('membres(numero_membre)', { ascending: true })

  if (filtreEstat) {
    query = query.eq('estat', filtreEstat)
  }

  const { data: socis } = await query

  // Filtre de cerca client-side (simple)
  const socisFiltrats = (socis ?? []).filter((s) => {
    if (!cerca) return true
    const m = s.membres as unknown as { nom: string; cognom1: string; email: string | null; numero_membre: number }
    const text = `${m.nom} ${m.cognom1} ${m.email ?? ''} ${m.numero_membre}`.toLowerCase()
    return text.includes(cerca)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Socis</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {socisFiltrats.length} soci{socisFiltrats.length !== 1 ? 's' : ''}
            {filtreEstat ? ` (${ESTAT_LABELS[filtreEstat]})` : ''}
          </p>
        </div>
      </div>

      {/* Filtres ràpids */}
      <div className="flex flex-wrap gap-2">
        {(['', 'actiu', 'pendent_pagament', 'baixa'] as const).map((e) => (
          <a
            key={e}
            href={e ? `/backoffice/socis?estat=${e}` : '/backoffice/socis'}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
              (filtreEstat === e || (!filtreEstat && !e))
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border hover:bg-muted'
            )}
          >
            {e ? ESTAT_LABELS[e as EstatSoci] : 'Tots'}
          </a>
        ))}
      </div>

      {/* Taula */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">#</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Soci</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Correu</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estat</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Alta</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {socisFiltrats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No s&apos;han trobat socis
                  </td>
                </tr>
              ) : (
                socisFiltrats.map((s) => {
                  const m = s.membres as unknown as {
                    nom: string
                    cognom1: string
                    email: string | null
                    numero_membre: number
                  }
                  return (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        <a href={`/backoffice/socis/${s.id}`} className="hover:underline">
                          {m.numero_membre}
                        </a>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        <a href={`/backoffice/socis/${s.id}`} className="hover:underline">
                          {m.nom} {m.cognom1}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {m.email ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          ESTAT_CLASSES[s.estat]
                        )}>
                          {ESTAT_LABELS[s.estat]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                        {s.data_alta
                          ? new Intl.DateTimeFormat('ca-ES').format(new Date(s.data_alta))
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {m.email && <ReenviarBenvingudaButton sociId={s.id} />}
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
