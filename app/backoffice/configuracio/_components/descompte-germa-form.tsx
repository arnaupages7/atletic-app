'use client'

import { useActionState, useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { desarDescompteGermaAction } from '../actions'

export function DescompteGermaForm({
  tipusActual,
  valorActual,
}: {
  tipusActual: 'import_fix' | 'percentatge'
  valorActual: number
}) {
  const [state, action, pending] = useActionState(desarDescompteGermaAction, undefined)
  const [tipus, setTipus] = useState<'import_fix' | 'percentatge'>(tipusActual)

  return (
    <form action={action} className="space-y-4 max-w-xs">
      <div className="space-y-2">
        <Label htmlFor="descompte_germa_tipus">Tipus de descompte</Label>
        <Select
          name="descompte_germa_tipus"
          value={tipus}
          onValueChange={(v) => setTipus(v as 'import_fix' | 'percentatge')}
        >
          <SelectTrigger id="descompte_germa_tipus">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="import_fix" label="Import fix (€)">Import fix (€)</SelectItem>
            <SelectItem value="percentatge" label="Percentatge (%)">Percentatge (%)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descompte_germa_valor">
          {tipus === 'import_fix' ? 'Import del descompte' : 'Percentatge del descompte'}
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="descompte_germa_valor"
            name="descompte_germa_valor"
            type="number"
            min={0}
            step={tipus === 'import_fix' ? 1 : 0.5}
            max={tipus === 'percentatge' ? 100 : undefined}
            defaultValue={valorActual}
            className="font-mono w-24"
          />
          <span className="text-sm text-muted-foreground">
            {tipus === 'import_fix' ? '€' : '%'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {tipus === 'import_fix'
            ? 'Descompte en euros sobre el preu final del jugador.'
            : 'Descompte percentual sobre el preu final del jugador.'}
          {' '}S&apos;aplica automàticament si el soci ja té un altre jugador actiu.
        </p>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-green-600 flex items-center gap-1.5">
          <CheckCircle2 className="size-4" /> Descompte desat correctament.
        </p>
      )}

      <Button type="submit" size="sm" disabled={pending}>
        {pending && <Loader2 className="size-4 mr-2 animate-spin" />}
        Desar descompte
      </Button>
    </form>
  )
}
