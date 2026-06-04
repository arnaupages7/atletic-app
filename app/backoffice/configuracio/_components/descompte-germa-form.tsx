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
  // Si valorActual és 0, el descompte estava desactivat
  const [actiu, setActiu] = useState(valorActual > 0)
  const [tipus, setTipus] = useState<'import_fix' | 'percentatge'>(tipusActual)

  return (
    <form action={action} className="space-y-4 max-w-sm">
      {/* Toggle principal */}
      <div className="flex items-center gap-2.5">
        <input
          type="checkbox"
          id="descompte_actiu"
          checked={actiu}
          onChange={(e) => setActiu(e.target.checked)}
          className="size-4 rounded border-input"
        />
        <Label htmlFor="descompte_actiu" className="cursor-pointer font-medium">
          Aplicar descompte per germà/na
        </Label>
      </div>

      {/* Configuració visible només si actiu */}
      {actiu ? (
        <div className="space-y-3 pl-6 border-l-2 border-border">
          {/* Tipus */}
          <div className="space-y-1.5">
            <Label htmlFor="descompte_germa_tipus">Tipus</Label>
            <Select
              name="descompte_germa_tipus"
              value={tipus}
              onValueChange={(v) => setTipus(v as 'import_fix' | 'percentatge')}
            >
              <SelectTrigger id="descompte_germa_tipus" className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="import_fix" label="Import fix (€)">
                  Import fix (€)
                </SelectItem>
                <SelectItem value="percentatge" label="Percentatge (%)">
                  Percentatge (%)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Valor */}
          <div className="space-y-1.5">
            <Label htmlFor="descompte_germa_valor">
              {tipus === 'import_fix' ? 'Import del descompte' : 'Percentatge del descompte'}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="descompte_germa_valor"
                name="descompte_germa_valor"
                type="number"
                min={0.01}
                step={tipus === 'import_fix' ? 1 : 0.5}
                max={tipus === 'percentatge' ? 100 : undefined}
                defaultValue={valorActual > 0 ? valorActual : tipus === 'import_fix' ? 25 : 10}
                className="font-mono w-24"
              />
              <span className="text-sm text-muted-foreground">
                {tipus === 'import_fix' ? '€' : '%'}
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            S&apos;aplica automàticament si el soci ja té un altre jugador actiu al club.
          </p>
        </div>
      ) : (
        /* Hidden: guardar valor 0 per indicar desactivat */
        <>
          <input type="hidden" name="descompte_germa_tipus" value={tipus} />
          <input type="hidden" name="descompte_germa_valor" value="0" />
          <p className="text-xs text-muted-foreground pl-6">
            No s&apos;aplicarà cap descompte per germà/na.
          </p>
        </>
      )}

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-green-600 flex items-center gap-1.5">
          <CheckCircle2 className="size-4" /> Desat correctament.
        </p>
      )}

      <Button type="submit" size="sm" disabled={pending}>
        {pending && <Loader2 className="size-4 mr-2 animate-spin" />}
        Desar descompte
      </Button>
    </form>
  )
}
