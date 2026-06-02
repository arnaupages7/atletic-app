'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save } from 'lucide-react'
import { crearCupoAction } from '../actions'

export function CupoForm() {
  const [state, action, pending] = useActionState(crearCupoAction, undefined)

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
            min={1}
            placeholder="p.ex. 20 o 500 (cèntims)"
            aria-invalid={!!state?.errors?.valor}
          />
          <p className="text-xs text-muted-foreground">
            % o cèntims (500 = 5€)
          </p>
          {state?.errors?.valor && (
            <p className="text-xs text-destructive">{state.errors.valor[0]}</p>
          )}
        </div>
      </div>

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
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Save className="size-4" />
        )}
        {pending ? 'Creant…' : 'Crear cupó'}
      </Button>
    </form>
  )
}
