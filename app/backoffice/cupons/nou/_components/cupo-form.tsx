'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save } from 'lucide-react'
import { crearCupoAction } from '../actions'

type Equip = { id: string; nom: string }

export function CupoForm({ equips }: { equips: Equip[] }) {
  const [state, action, pending] = useActionState(crearCupoAction, undefined)
  const [aplicableA, setAplicableA] = useState<'soci' | 'jugador' | 'tots'>('tots')

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Codi */}
      <div className="space-y-1.5">
        <Label htmlFor="codi">
          Codi <span className="text-destructive">*</span>
        </Label>
        <Input
          id="codi"
          name="codi"
          placeholder="NADAL25"
          className="uppercase"
          style={{ textTransform: 'uppercase' }}
          aria-invalid={!!state?.errors?.codi}
        />
        <p className="text-xs text-muted-foreground">
          Majúscules, números, guions. El soci l&apos;introdueix al portal.
        </p>
        {state?.errors?.codi && (
          <p className="text-xs text-destructive">{state.errors.codi[0]}</p>
        )}
      </div>

      {/* Descripció */}
      <div className="space-y-1.5">
        <Label htmlFor="descripcio">Descripció interna</Label>
        <Input
          id="descripcio"
          name="descripcio"
          placeholder="Descompte campanya Nadal 2025"
        />
      </div>

      {/* Tipus + Valor */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="tipus">
            Tipus <span className="text-destructive">*</span>
          </Label>
          <select
            id="tipus"
            name="tipus"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:ring-1 focus-visible:ring-ring"
            aria-invalid={!!state?.errors?.tipus}
          >
            <option value="percentatge">Percentatge (%)</option>
            <option value="import_fix">Import fix (€)</option>
          </select>
          {state?.errors?.tipus && (
            <p className="text-xs text-destructive">{state.errors.tipus[0]}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="valor">
            Valor <span className="text-destructive">*</span>
          </Label>
          <Input
            id="valor"
            name="valor"
            type="number"
            min={0.01}
            step={0.01}
            placeholder="p.ex. 20 o 5.50"
            aria-invalid={!!state?.errors?.valor}
          />
          <p className="text-xs text-muted-foreground">% o euros (5.50 = 5,50€)</p>
          {state?.errors?.valor && (
            <p className="text-xs text-destructive">{state.errors.valor[0]}</p>
          )}
        </div>
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

      {/* Equip específic (només visible quan aplicable_a = jugador) */}
      {aplicableA === 'jugador' && (
        <div className="space-y-1.5">
          <Label htmlFor="equip_id">Equip específic</Label>
          <select
            id="equip_id"
            name="equip_id"
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
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="data_expiracio">Data d&apos;expiració</Label>
          <Input id="data_expiracio" name="data_expiracio" type="date" />
        </div>
      </div>

      <Button type="submit" disabled={pending} className="gap-1.5">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        {pending ? 'Creant…' : 'Crear cupó'}
      </Button>
    </form>
  )
}
