'use client'

import { useActionState, useState } from 'react'
import { inscriureJugadorAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Upload, X, FileImage } from 'lucide-react'
import { cn } from '@/lib/utils'

type Equip = { id: string; nom: string; places_disponibles: number | null }

const TALLES = ['Miss', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] as const

function FieldError({
  errors,
  field,
}: {
  errors?: Record<string, string[]>
  field: string
}) {
  const msgs = errors?.[field]
  if (!msgs?.length) return null
  return <p className="text-xs text-destructive mt-1">{msgs[0]}</p>
}

export function InscripcioForm({ equips }: { equips: Equip[] }) {
  const [state, action, pending] = useActionState(inscriureJugadorAction, undefined)
  const [fotoNom, setFotoNom] = useState<string | null>(null)

  return (
    <form action={action} encType="multipart/form-data" className="space-y-8">
      {/* Error general */}
      {state?.error && (
        <div
          role="alert"
          className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {state.error}
        </div>
      )}

      {/* ── Secció 1: Dades personals del jugador ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Dades personals del jugador</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dades del menor que s&apos;inscriu, no del tutor.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="nom">Nom</Label>
            <Input
              id="nom"
              name="nom"
              autoComplete="off"
              aria-invalid={!!state?.errors?.nom}
              required
            />
            <FieldError errors={state?.errors} field="nom" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cognom1">Primer cognom</Label>
            <Input
              id="cognom1"
              name="cognom1"
              autoComplete="off"
              aria-invalid={!!state?.errors?.cognom1}
              required
            />
            <FieldError errors={state?.errors} field="cognom1" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cognom2">
              Segon cognom{' '}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input id="cognom2" name="cognom2" autoComplete="off" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="data_naixement">Data de naixement</Label>
            <Input
              id="data_naixement"
              name="data_naixement"
              type="date"
              max={new Date().toISOString().split('T')[0]}
              aria-invalid={!!state?.errors?.data_naixement}
              required
            />
            <FieldError errors={state?.errors} field="data_naixement" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dni">DNI / NIE</Label>
            <Input
              id="dni"
              name="dni"
              placeholder="12345678A"
              autoComplete="off"
              aria-invalid={!!state?.errors?.dni}
              required
            />
            <FieldError errors={state?.errors} field="dni" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="genere">Gènere</Label>
            <Select name="genere">
              <SelectTrigger id="genere">
                <SelectValue placeholder="Selecciona…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Masculí</SelectItem>
                <SelectItem value="F">Femení</SelectItem>
                <SelectItem value="A">Altre / no especificat</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Secció 2: Inscripció esportiva ── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Inscripció esportiva</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="equip_id">Equip</Label>
            <Select name="equip_id" required>
              <SelectTrigger id="equip_id" aria-invalid={!!state?.errors?.equip_id}>
                <SelectValue placeholder="Selecciona equip…" />
              </SelectTrigger>
              <SelectContent>
                {equips.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nom}
                    {e.places_disponibles !== null && e.places_disponibles <= 3 && (
                      <span className="ml-2 text-xs text-orange-500">
                        ({e.places_disponibles} places)
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={state?.errors} field="equip_id" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="talla_samarreta">Talla de samarreta</Label>
            <Select name="talla_samarreta" required>
              <SelectTrigger
                id="talla_samarreta"
                aria-invalid={!!state?.errors?.talla_samarreta}
              >
                <SelectValue placeholder="Selecciona talla…" />
              </SelectTrigger>
              <SelectContent>
                {TALLES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={state?.errors} field="talla_samarreta" />
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Secció 3: Informació mèdica + foto ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Documentació</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Requerida per la federació i per l&apos;assegurança del club.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="num_catsalut">Número targeta CATSalut</Label>
            <Input
              id="num_catsalut"
              name="num_catsalut"
              placeholder="1234567890A"
              autoComplete="off"
              aria-invalid={!!state?.errors?.num_catsalut}
              required
            />
            <FieldError errors={state?.errors} field="num_catsalut" />
            <p className="text-xs text-muted-foreground">
              Targeta sanitària individual (TSI). Obligatori per a jugadors menors.
            </p>
          </div>

          {/* Upload foto fitxa */}
          <div className="space-y-1.5">
            <Label htmlFor="foto_fitxa">
              Foto fitxa{' '}
              <span className="text-muted-foreground font-normal">(obligatòria)</span>
            </Label>
            <label
              htmlFor="foto_fitxa"
              className={cn(
                'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 cursor-pointer',
                'hover:bg-muted/50 transition-colors',
                state?.errors?.foto_fitxa
                  ? 'border-destructive'
                  : 'border-border',
                fotoNom && 'bg-muted/30 border-solid border-primary/30'
              )}
            >
              {fotoNom ? (
                <>
                  <FileImage className="size-6 text-primary" />
                  <span className="text-xs font-medium text-foreground text-center break-all max-w-full">
                    {fotoNom}
                  </span>
                  <span
                    role="button"
                    onClick={(e) => {
                      e.preventDefault()
                      setFotoNom(null)
                      const input = document.getElementById('foto_fitxa') as HTMLInputElement
                      if (input) input.value = ''
                    }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3" />
                    Treure
                  </span>
                </>
              ) : (
                <>
                  <Upload className="size-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground text-center">
                    Clica per seleccionar o arrossega aquí
                    <br />
                    JPG, PNG o WebP · màx. 5 MB
                  </span>
                </>
              )}
            </label>
            <input
              id="foto_fitxa"
              name="foto_fitxa"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0]
                setFotoNom(file?.name ?? null)
              }}
            />
            <FieldError errors={state?.errors} field="foto_fitxa" />
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Secció 4: Contacte ── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Adreça i contacte</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="adreca">Adreça</Label>
            <Input
              id="adreca"
              name="adreca"
              placeholder="Carrer de les Flors, 12, 1r 1a"
              aria-invalid={!!state?.errors?.adreca}
              required
            />
            <FieldError errors={state?.errors} field="adreca" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="telefon">Telèfon de contacte</Label>
            <Input
              id="telefon"
              name="telefon"
              type="tel"
              placeholder="600 000 000"
              aria-invalid={!!state?.errors?.telefon}
              required
            />
            <FieldError errors={state?.errors} field="telefon" />
            <p className="text-xs text-muted-foreground">
              Telèfon del tutor legal per a urgències.
            </p>
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Secció 5: Consentiments ── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Consentiments</h2>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="consentiment_privacitat"
              name="consentiment_privacitat"
              value="on"
              required
              aria-invalid={!!state?.errors?.consentiment_privacitat}
            />
            <div className="space-y-1">
              <Label
                htmlFor="consentiment_privacitat"
                className="text-sm leading-snug cursor-pointer"
              >
                Accepto la{' '}
                <a
                  href="/politica-privacitat"
                  className="underline underline-offset-4"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  política de privacitat
                </a>{' '}
                i el tractament de les dades del menor per part del club,
                incloent-hi les dades mèdiques i la imatge. (Obligatori)
              </Label>
              <FieldError errors={state?.errors} field="consentiment_privacitat" />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="consentiment_comunicacions"
              name="consentiment_comunicacions"
              value="on"
            />
            <Label
              htmlFor="consentiment_comunicacions"
              className="text-sm leading-snug cursor-pointer"
            >
              Accepto rebre comunicacions del club (informació d&apos;entrenaments,
              convocatòries i activitats). (Opcional)
            </Label>
          </div>
        </div>
      </section>

      {/* ── Avís quota ── */}
      <div className="rounded-lg border border-muted bg-muted/30 p-4 text-sm text-muted-foreground">
        Un cop enviada la sol·licitud, el club la revisarà i t&apos;avisarà per correu.
        Si és aprovada, rebràs un enllaç per pagar la quota del jugador{' '}
        <strong className="text-foreground">(300 €/temporada)</strong>.
      </div>

      {/* ── Enviar ── */}
      <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
        {pending ? 'Enviant sol·licitud…' : 'Enviar sol·licitud'}
      </Button>
    </form>
  )
}
