'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ImageUpload } from '@/components/ui/image-upload'
import { Save, Video } from 'lucide-react'

export type EventFormState = {
  error?: string
  errors?: Record<string, string[]>
} | undefined

type EventDefaults = {
  titol?: string
  descripcio?: string | null
  data_inici?: string
  data_fi?: string | null
  lloc?: string | null
  imatge_url?: string | null
  embed_url?: string | null
  exclusiu_socis?: boolean
  publicat?: boolean
}

type Props = {
  action: (prevState: EventFormState, formData: FormData) => Promise<EventFormState>
  defaults?: EventDefaults
  submitLabel?: string
  pendingLabel?: string
}

export function EventForm({ action, defaults, submitLabel = 'Desar', pendingLabel = 'Desant…' }: Props) {
  const [state, formAction, pending] = useActionState<EventFormState, FormData>(action, undefined)
  const [imatgeUrl, setImatgeUrl] = useState<string | null>(defaults?.imatge_url ?? null)

  const toDatetimeLocal = (iso: string | null | undefined) => {
    if (!iso) return ''
    return iso.slice(0, 16)
  }

  return (
    <form action={formAction} className="space-y-5">
      {/* Hidden field per a imatge_url (actualitzat per ImageUpload) */}
      <input type="hidden" name="imatge_url" value={imatgeUrl ?? ''} />

      {state?.error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Títol */}
      <div className="space-y-1.5">
        <Label htmlFor="titol">Títol <span className="text-destructive">*</span></Label>
        <Input
          id="titol"
          name="titol"
          defaultValue={defaults?.titol ?? ''}
          aria-invalid={!!state?.errors?.titol}
          required
        />
        {state?.errors?.titol && (
          <p className="text-xs text-destructive">{state.errors.titol[0]}</p>
        )}
      </div>

      {/* Descripció */}
      <div className="space-y-1.5">
        <Label htmlFor="descripcio">Descripció</Label>
        <Textarea
          id="descripcio"
          name="descripcio"
          rows={4}
          defaultValue={defaults?.descripcio ?? ''}
          placeholder="Descripció opcional de l'event…"
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="data_inici">Data d&apos;inici <span className="text-destructive">*</span></Label>
          <Input
            id="data_inici"
            name="data_inici"
            type="datetime-local"
            defaultValue={toDatetimeLocal(defaults?.data_inici)}
            aria-invalid={!!state?.errors?.data_inici}
            required
          />
          {state?.errors?.data_inici && (
            <p className="text-xs text-destructive">{state.errors.data_inici[0]}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="data_fi">Data de fi</Label>
          <Input
            id="data_fi"
            name="data_fi"
            type="datetime-local"
            defaultValue={toDatetimeLocal(defaults?.data_fi)}
          />
        </div>
      </div>

      {/* Lloc */}
      <div className="space-y-1.5">
        <Label htmlFor="lloc">Lloc</Label>
        <Input
          id="lloc"
          name="lloc"
          defaultValue={defaults?.lloc ?? ''}
          placeholder="Camp Municipal de Banyoles…"
        />
      </div>

      {/* Imatge de portada */}
      <div className="space-y-1.5">
        <Label>Imatge de portada</Label>
        <ImageUpload
          value={imatgeUrl}
          onUrlChange={setImatgeUrl}
          carpeta="events"
        />
        {imatgeUrl && (
          <p className="text-xs text-muted-foreground break-all">{imatgeUrl}</p>
        )}
      </div>

      {/* Vídeo incrustat */}
      <div className="space-y-1.5">
        <Label htmlFor="embed_url" className="flex items-center gap-1.5">
          <Video className="size-4 text-muted-foreground" />
          URL de vídeo incrustat
        </Label>
        <Input
          id="embed_url"
          name="embed_url"
          type="url"
          defaultValue={defaults?.embed_url ?? ''}
          placeholder="https://www.youtube.com/embed/VIDEO_ID"
        />
        <p className="text-xs text-muted-foreground">
          URL d&apos;incrustació (embed) de YouTube, Twitch o similar. Per a YouTube:
          copia l&apos;URL del format <code className="text-xs bg-muted px-1 rounded">youtube.com/embed/ID</code>.
        </p>
      </div>

      {/* Opcions */}
      <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
        <p className="text-sm font-medium">Opcions</p>
        <div className="flex items-center gap-2">
          <Checkbox
            id="exclusiu_socis"
            name="exclusiu_socis"
            defaultChecked={defaults?.exclusiu_socis ?? false}
          />
          <Label htmlFor="exclusiu_socis" className="font-normal cursor-pointer">
            Exclusiu per a socis
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="publicat"
            name="publicat"
            defaultChecked={defaults?.publicat ?? false}
          />
          <Label htmlFor="publicat" className="font-normal cursor-pointer">
            Publicat (visible al portal)
          </Label>
        </div>
      </div>

      <Button type="submit" disabled={pending} className="gap-1.5">
        <Save className="size-4" />
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  )
}
