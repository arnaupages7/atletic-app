'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { canviarEquipAction } from '../actions'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

type Equip = { id: string; nom: string }

export function CanviEquipForm({
  jugadorId,
  equipActualId,
  equips,
}: {
  jugadorId: string
  equipActualId: string | null
  equips: Equip[]
}) {
  const router = useRouter()
  const action = canviarEquipAction.bind(null, jugadorId)
  const [state, formAction, pending] = useActionState(action, undefined)
  const [equipId, setEquipId] = useState(equipActualId ?? '')

  // Refresca la pàgina quan el canvi és correcte
  useEffect(() => {
    if (state?.ok) {
      router.refresh()
    }
  }, [state?.ok, router])

  const equipActual = equips.find((e) => e.id === equipActualId)?.nom ?? '—'
  const equipSeleccionat = equips.find((e) => e.id === equipId)?.nom

  return (
    <form action={formAction} className="space-y-3">
      {state?.ok && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          <CheckCircle2 className="size-4 shrink-0" />
          Equip actualitzat correctament.
        </div>
      )}
      {state?.error && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}

      <div className="flex items-center gap-2">
        <Select
          name="equip_id"
          value={equipId}
          onValueChange={(v) => setEquipId(v ?? '')}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Selecciona equip…">
              {equipSeleccionat}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {equips.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={pending || equipId === equipActualId}
        >
          {pending ? 'Guardant…' : 'Canviar'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Equip actual: <span className="font-medium">{equipActual}</span>
      </p>
    </form>
  )
}
