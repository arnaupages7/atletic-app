'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save } from 'lucide-react'
import { editarCupoAction } from '../actions'

type Equip = { id: string; nom: string }

type Defaults = {
  descripcio: string | null
  usos_maxims: number | null
  data_expiracio: string | null
  aplicable_a: 'soci' | 'jugador' | 'tots'
  equip_id: string | null
}

export function EditarCupoForm({
  cupoId,
  defaults,
  equips,
}: {
  cupoId: string
  defaults: Defaults
  equips: Equip[]
}) {
  const boundAction = editarCupoAction.bind(null, cupoId)
  const [state, action, pending] = useActionState(boundAction, undefined)
  const [aplicableA, setAplicableA] = useState<'soci' | 'jugador' | 'tots'>(
    defaults.aplicable_a
  )

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Descripció */}
      <div className="space-y-1.5">
        <Label htmlFor="descripcio">Descripció interna</Label>
        <Input
          id="descripcio"
          name="descripcio"
          defaultValue={defaults.descripcio ?? ''}
          placeholder="Descompte campanya Nadal 2025"
        />
      </div>

      {/* Aplicable a */}
      <div className="space-y-1.5">
        <Label htmlFor="aplicable_a">Aplicable a</Label>
        <select
          id="aplicable_a"
          name="aplicable_a"
          value={aplicableA}
          onChange={(e) => setAplicableA(e.target.value as typeof aplicableA)}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="tots">Tots (quota soci i inscripcions jugadors)</option>
          <option value="soci">Quota de soci únicament</option>
          <option value="jugador">Inscripció jugadors únicament</option>
        </select>
      </div>

      {/* Equip específic */}
      {aplicableA === 'jugador' && (
        <div className="space-y-1.5">
          <Label htmlFor="equip_id">Equip específic</Label>
          <select
            id="equip_id"
            name="equip_id"
            defaultValue={defaults.equip_id ?? ''}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Tots els equips</option>
            {equips.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nom}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Deixa en blanc per aplicar-lo a qualsevol equip.
          </p>
        </div>
      )}

      {/* Usos màxims + Expiració */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="usos_maxims">Usos màxims</Label>
          <Input
            id="usos_maxims"
            name="usos_maxims"
            type="number"
            min={1}
            placeholder="il·limitat"
            defaultValue={defaults.usos_maxims ?? ''}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="data_expiracio">Data d&apos;expiració</Label>
          <Input
            id="data_expiracio"
            name="data_expiracio"
            type="date"
            defaultValue={defaults.data_expiracio ?? ''}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        El codi, el tipus i el valor no es poden modificar un cop creat el cupó.
      </p>

      <Button type="submit" disabled={pending} className="gap-1.5">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        {pending ? 'Desant…' : 'Desar canvis'}
      </Button>
    </form>
  )
}
