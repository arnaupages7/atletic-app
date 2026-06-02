'use client'

import { useActionState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { desarConfiguracioGeneralAction } from '../actions'

interface Props {
  carnetFonsUrl: string
}

export function ConfiguracioGeneralForm({ carnetFonsUrl }: Props) {
  const [state, action, pending] = useActionState(desarConfiguracioGeneralAction, undefined)

  return (
    <form action={action} className="space-y-4 max-w-lg">
      <div className="space-y-1.5">
        <Label htmlFor="carnet_fons_url">URL de la imatge de fons</Label>
        <Input
          id="carnet_fons_url"
          name="carnet_fons_url"
          type="url"
          defaultValue={carnetFonsUrl}
          placeholder="https://exemple.com/fons-carnet.jpg"
        />
        <p className="text-xs text-muted-foreground">
          Ha de ser una URL pública accessible. Mida recomanada: 680×426 px (proporció 8:5).
        </p>
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-green-600 flex items-center gap-1.5">
          <CheckCircle2 className="size-4" /> Configuració desada correctament.
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="size-4 mr-2 animate-spin" />}
        Desar canvis
      </Button>
    </form>
  )
}
