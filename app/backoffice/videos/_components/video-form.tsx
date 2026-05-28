'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Save } from 'lucide-react'

export type VideoFormState = {
  error?: string
  errors?: Record<string, string[]>
} | undefined

type VideoDefaults = {
  titol?: string
  descripcio?: string | null
  url_youtube?: string
  exclusiu_socis?: boolean
  publicat?: boolean
}

type Props = {
  action: (prevState: VideoFormState, formData: FormData) => Promise<VideoFormState>
  defaults?: VideoDefaults
  submitLabel?: string
  pendingLabel?: string
}

export function VideoForm({ action, defaults, submitLabel = 'Desar', pendingLabel = 'Desant…' }: Props) {
  const [state, formAction, pending] = useActionState<VideoFormState, FormData>(action, undefined)

  return (
    <form action={formAction} className="space-y-5">
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

      {/* URL YouTube */}
      <div className="space-y-1.5">
        <Label htmlFor="url_youtube">
          URL YouTube <span className="text-destructive">*</span>
        </Label>
        <Input
          id="url_youtube"
          name="url_youtube"
          type="url"
          defaultValue={defaults?.url_youtube ?? ''}
          placeholder="https://www.youtube.com/watch?v=..."
          aria-invalid={!!state?.errors?.url_youtube}
          required
        />
        {state?.errors?.url_youtube && (
          <p className="text-xs text-destructive">{state.errors.url_youtube[0]}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Admet formats: youtube.com/watch?v=, youtu.be/, youtube.com/embed/
        </p>
      </div>

      {/* Descripció */}
      <div className="space-y-1.5">
        <Label htmlFor="descripcio">Descripció</Label>
        <Textarea
          id="descripcio"
          name="descripcio"
          rows={3}
          defaultValue={defaults?.descripcio ?? ''}
          placeholder="Descripció opcional del vídeo…"
        />
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
