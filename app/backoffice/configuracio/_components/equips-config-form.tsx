'use client'

import { useActionState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { desarConfigEquipsAction } from '../actions'

export interface EquipConfig {
  id: string
  nom: string
  slug: string
  temporada: string
  preu_inscripcio: number | null
  soci_automatic: boolean
}

export function EquipsConfigForm({ equips }: { equips: EquipConfig[] }) {
  const [state, action, pending] = useActionState(desarConfigEquipsAction, undefined)

  return (
    <form action={action} className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Configura el preu d&apos;inscripció (en cèntims: 30000 = 300€) i si l&apos;equip activa soci
        automàtic (sense pagament). Deixa el preu en blanc per usar el preu per defecte.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Equip</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Temporada</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground w-36">
                Preu (cèntims)
              </th>
              <th className="text-center px-3 py-2 font-medium text-muted-foreground w-28">
                Soci automàtic
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {equips.map((equip) => (
              <tr key={equip.id} className="hover:bg-muted/20">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">{equip.nom}</span>
                    <Badge variant="outline" className="text-xs font-mono hidden sm:inline-flex">
                      {equip.slug}
                    </Badge>
                  </div>
                </td>
                <td className="px-3 py-2 text-muted-foreground text-xs">{equip.temporada}</td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    name={`preu_${equip.id}`}
                    defaultValue={equip.preu_inscripcio ?? ''}
                    placeholder="per defecte"
                    min={0}
                    step={100}
                    className="h-8 text-sm w-32"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    name={`soci_automatic_${equip.id}`}
                    defaultChecked={equip.soci_automatic}
                    className="size-4 rounded"
                  />
                </td>
              </tr>
            ))}
            {equips.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground text-sm">
                  No hi ha equips actius. Afegeix equips primer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* IDs dels equips per processar */}
      <input type="hidden" name="equip_ids" value={equips.map((e) => e.id).join(',')} />

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-green-600 flex items-center gap-1.5">
          <CheckCircle2 className="size-4" /> Configuració d&apos;equips desada.
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="size-4 mr-2 animate-spin" />}
        Desar equips
      </Button>
    </form>
  )
}
