'use client'

import { useActionState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { desarPlantillaAction } from '../../../actions'

interface Props {
  id: string
  assumpte: string
  cosHtml: string
}

export function PlantillaForm({ id, assumpte, cosHtml }: Props) {
  const [state, action, pending] = useActionState(desarPlantillaAction, undefined)

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="id" value={id} />

      <div className="space-y-1.5">
        <Label htmlFor="assumpte">Assumpte del correu</Label>
        <Input
          id="assumpte"
          name="assumpte"
          defaultValue={assumpte}
          required
          placeholder="Benvingut/da a l'Atlètic Club Banyoles!"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cos_html">Cos del correu (HTML)</Label>
        <Textarea
          id="cos_html"
          name="cos_html"
          defaultValue={cosHtml}
          required
          rows={18}
          className="font-mono text-xs"
          placeholder="<html>...</html>"
        />
        <p className="text-xs text-muted-foreground">
          Pots fer servir les variables disponibles i HTML estàndard compatible amb clients de
          correu.
        </p>
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-green-600 flex items-center gap-1.5">
          <CheckCircle2 className="size-4" /> Plantilla desada correctament.
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="size-4 mr-2 animate-spin" />}
        Desar plantilla
      </Button>
    </form>
  )
}
