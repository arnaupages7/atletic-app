'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, Loader2, Copy } from 'lucide-react'
import { clonarTemporadaAction } from '../actions'

function nextSeason(current: string): string {
  const parts = current.split('-')
  const y1 = parseInt(parts[0]) + 1
  const y2 = parseInt(parts[1]) + 1
  return `${y1}-${String(y2).padStart(2, '0')}`
}

interface EquipInfo {
  id: string
  nom: string
  actiu: boolean
}

export function PreparaTemporadaForm({
  temporadaActiva,
  equips,
}: {
  temporadaActiva: string
  equips: EquipInfo[]
}) {
  const [state, action, pending] = useActionState(clonarTemporadaAction, undefined)
  const suggerida = nextSeason(temporadaActiva)
  const actius = equips.filter((e) => e.actiu)

  if (state?.success) {
    return (
      <p className="text-sm text-green-600 flex items-center gap-1.5">
        <CheckCircle2 className="size-4" />
        Temporada preparada correctament. Actualitza la pàgina per veure els nous equips.
      </p>
    )
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="temporada_origen" value={temporadaActiva} />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="space-y-1.5 max-w-xs">
          <Label htmlFor="temporada_desti">Nova temporada</Label>
          <Input
            id="temporada_desti"
            name="temporada_desti"
            defaultValue={suggerida}
            placeholder="2026-27"
            pattern="\d{4}-\d{2}"
            maxLength={7}
            className="font-mono w-36"
          />
        </div>

        <div className="space-y-1.5 self-end">
          <p className="text-xs text-muted-foreground">
            {actius.length > 0 ? (
              <>
                Es clonaran <strong>{actius.length}</strong> equip{actius.length !== 1 ? 's' : ''}:{' '}
                {actius.map((e) => e.nom).join(', ')}.
              </>
            ) : (
              'No hi ha equips actius per clonar.'
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="actualitzar_activa"
          name="actualitzar_activa"
          defaultChecked
          className="size-4 rounded"
        />
        <Label htmlFor="actualitzar_activa" className="text-sm font-normal cursor-pointer">
          Actualitzar la temporada activa a <span className="font-mono font-semibold">{suggerida}</span>
        </Label>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={pending || actius.length === 0}
        className="gap-1.5"
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Copy className="size-3.5" />
        )}
        {pending ? 'Preparant…' : `Preparar temporada ${suggerida}`}
      </Button>
    </form>
  )
}
