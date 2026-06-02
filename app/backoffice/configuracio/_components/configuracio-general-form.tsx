'use client'

import { useActionState, useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ImageUpload } from '@/components/ui/image-upload'
import { desarConfiguracioGeneralAction } from '../actions'

interface Props {
  carnetFonsUrl: string
}

export function ConfiguracioGeneralForm({ carnetFonsUrl }: Props) {
  const [state, action, pending] = useActionState(desarConfiguracioGeneralAction, undefined)
  const [imatgeUrl, setImatgeUrl] = useState<string | null>(carnetFonsUrl || null)

  return (
    <form action={action} className="space-y-5 max-w-lg">
      <input type="hidden" name="carnet_fons_url" value={imatgeUrl ?? ''} />

      <div className="space-y-2">
        <Label>Imatge de fons del carnet</Label>
        <ImageUpload
          value={imatgeUrl}
          onUrlChange={setImatgeUrl}
          carpeta="configuracio"
        />
        <p className="text-xs text-muted-foreground">
          Mida recomanada: 680×426 px (proporció 8:5). Deixa buit per usar el gradient
          taronja per defecte.
        </p>
        {imatgeUrl && (
          <>
            <p className="text-xs font-medium text-muted-foreground mt-1">O introdueix una URL directament:</p>
            <Input
              type="url"
              value={imatgeUrl}
              onChange={(e) => setImatgeUrl(e.target.value || null)}
              placeholder="https://exemple.com/fons-carnet.jpg"
            />
          </>
        )}
        {!imatgeUrl && (
          <>
            <p className="text-xs font-medium text-muted-foreground">O introdueix una URL:</p>
            <Input
              type="url"
              placeholder="https://exemple.com/fons-carnet.jpg"
              onChange={(e) => setImatgeUrl(e.target.value || null)}
            />
          </>
        )}
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
