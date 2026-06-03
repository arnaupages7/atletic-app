'use client'

import { useActionState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { desarTemporadaAction } from '../actions'

export function TemporadaForm({ temporadaActiva }: { temporadaActiva: string }) {
  const [state, action, pending] = useActionState(desarTemporadaAction, undefined)

  return (
    <form action={action} className="space-y-4 max-w-xs">
      <div className="space-y-2">
        <Label htmlFor="temporada_activa">Temporada activa</Label>
        <Input
          id="temporada_activa"
          name="temporada_activa"
          defaultValue={temporadaActiva}
          placeholder="2026-27"
          pattern="\d{4}-\d{2}"
          maxLength={7}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          Format: <code className="bg-muted px-1 rounded">AAAA-AA</code> (ex: 2026-27).
          Aquesta temporada s&apos;assigna als jugadors nous que s&apos;inscriuen.
        </p>
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-green-600 flex items-center gap-1.5">
          <CheckCircle2 className="size-4" /> Temporada desada correctament.
        </p>
      )}

      <Button type="submit" size="sm" disabled={pending}>
        {pending && <Loader2 className="size-4 mr-2 animate-spin" />}
        Desar temporada
      </Button>
    </form>
  )
}
