'use client'

import { useActionState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { desarPreuDefecteAction } from '../actions'

export function PreuDefecteForm({ preuDefecteEuros }: { preuDefecteEuros: number }) {
  const [state, action, pending] = useActionState(desarPreuDefecteAction, undefined)

  return (
    <form action={action} className="space-y-4 max-w-xs">
      <div className="space-y-2">
        <Label htmlFor="preu_defecte">Preu per defecte (€)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="preu_defecte"
            name="preu_defecte"
            type="number"
            min={0}
            step={1}
            defaultValue={preuDefecteEuros}
            className="font-mono w-28"
          />
          <span className="text-sm text-muted-foreground">€</span>
        </div>
        <p className="text-xs text-muted-foreground">
          S&apos;aplica als equips sense preu específic. El descompte de germà/na (25 €)
          es resta automàticament.
        </p>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-green-600 flex items-center gap-1.5">
          <CheckCircle2 className="size-4" /> Preu desat correctament.
        </p>
      )}

      <Button type="submit" size="sm" disabled={pending}>
        {pending && <Loader2 className="size-4 mr-2 animate-spin" />}
        Desar preu
      </Button>
    </form>
  )
}
