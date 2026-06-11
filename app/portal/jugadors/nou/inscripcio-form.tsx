'use client'

import { useActionState, useState, useRef } from 'react'
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
import { DateSelect } from '@/components/ui/date-select'
import { FileUploadZone } from './_components/file-upload-zone'

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

export function InscripcioForm({ equips, preuDefecteEuros = 300 }: { equips: Equip[]; preuDefecteEuros?: number }) {
  const [state, action, pending] = useActionState(inscriureJugadorAction, undefined)
  const v = state?.values ?? {}
  const formRef = useRef<HTMLFormElement>(null)
  const [compromisDeplasaments, setCompromisDeplasaments] = useState(v.compromis_desplacaments === 'on')
  const [avisVisible, setAvisVisible] = useState(false)

  // Selects controlats
  const getEquipLabel = (id: string) => {
    const e = equips.find((eq) => eq.id === id)
    if (!e) return ''
    return e.places_disponibles !== null && e.places_disponibles <= 3
      ? `${e.nom} (${e.places_disponibles} places)` : e.nom
  }
  const [equipId, setEquipId] = useState(v.equip_id ?? '')
  const [equipLabel, setEquipLabel] = useState(() => v.equip_id ? getEquipLabel(v.equip_id) : '')
  const [talla, setTalla] = useState(v.talla_samarreta ?? '')
  const [genere, setGenere] = useState(v.genere ?? '')

  const GENERE_LABELS: Record<string, string> = { M: 'Masculí', F: 'Femení', A: 'Altre / no especificat' }

  return (
    // key força remuntatge quan hi ha un nou error → defaultValue i defaultChecked s'apliquen
    <form
      ref={formRef}
      key={state?.timestamp ?? 0}
      action={action}
      encType="multipart/form-data"
      className="space-y-8"
      onSubmit={(e) => {
        if (!compromisDeplasaments && !avisVisible) {
          e.preventDefault()
          setAvisVisible(true)
          setTimeout(() => {
            document.getElementById('compromis_desplacaments')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 50)
        }
      }}
    >
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
              defaultValue={v.nom}
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
              defaultValue={v.cognom1}
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
            <Input id="cognom2" name="cognom2" autoComplete="off" defaultValue={v.cognom2} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="data_naixement">Data de naixement</Label>
            <DateSelect
              name="data_naixement"
              defaultValue={v.data_naixement}
              maxYear={new Date().getFullYear() - 4}
              invalid={!!state?.errors?.data_naixement}
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
              defaultValue={v.dni}
              aria-invalid={!!state?.errors?.dni}
              required
            />
            <FieldError errors={state?.errors} field="dni" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="genere">Gènere</Label>
            <Select name="genere" value={genere} onValueChange={(v) => setGenere(v ?? '')}>
              <SelectTrigger id="genere">
                <SelectValue placeholder="Selecciona…">{GENERE_LABELS[genere]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M" label="Masculí">Masculí</SelectItem>
                <SelectItem value="F" label="Femení">Femení</SelectItem>
                <SelectItem value="A" label="Altre / no especificat">Altre / no especificat</SelectItem>
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
            <Select name="equip_id" value={equipId} onValueChange={(v) => { setEquipId(v ?? ''); setEquipLabel(getEquipLabel(v ?? '')) }} required>
              <SelectTrigger id="equip_id" aria-invalid={!!state?.errors?.equip_id}>
                <SelectValue placeholder="Selecciona equip…">{equipLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {equips.map((e) => {
                  const label =
                    e.places_disponibles !== null && e.places_disponibles <= 3
                      ? `${e.nom} (${e.places_disponibles} places)`
                      : e.nom
                  return (
                    <SelectItem key={e.id} value={e.id} label={label}>
                      {label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <FieldError errors={state?.errors} field="equip_id" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="talla_samarreta">Talla de samarreta</Label>
            <Select name="talla_samarreta" value={talla} onValueChange={(v) => setTalla(v ?? '')} required>
              <SelectTrigger
                id="talla_samarreta"
                aria-invalid={!!state?.errors?.talla_samarreta}
              >
                <SelectValue placeholder="Selecciona talla…">{talla || undefined}</SelectValue>
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

      {/* ── Secció 3: Documentació ── */}
      <section className="space-y-5">
        <div>
          <h2 className="text-base font-semibold">Documentació</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Requerida per la federació i per l&apos;assegurança del club.
          </p>
        </div>

        {/* CATSalut + foto fitxa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="num_catsalut">Número targeta CATSalut</Label>
            <Input
              id="num_catsalut"
              name="num_catsalut"
              placeholder="1234567890A"
              autoComplete="off"
              defaultValue={v.num_catsalut}
              aria-invalid={!!state?.errors?.num_catsalut}
              required
            />
            <FieldError errors={state?.errors} field="num_catsalut" />
            <p className="text-xs text-muted-foreground">
              Targeta sanitària individual (TSI). Obligatori per a jugadors menors.
            </p>
          </div>

          <FileUploadZone
            id="foto_fitxa"
            name="foto_fitxa"
            label="Foto fitxa"
            sublabel="(obligatòria)"
            hasError={!!state?.errors?.foto_fitxa}
            errors={state?.errors?.foto_fitxa}
          />
        </div>

        {/* Foto DNI/NIE */}
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">Foto del DNI / NIE del jugador</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Puja una imatge clara de cada cara. El club la verificarà manualment abans d&apos;aprovar la inscripció.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FileUploadZone
              id="dni_davant"
              name="dni_davant"
              label="Cara davantera"
              sublabel="(obligatòria)"
              hasError={!!state?.errors?.dni_davant}
              errors={state?.errors?.dni_davant}
              hint="JPG, PNG o WebP · màx. 5 MB"
            />
            <FileUploadZone
              id="dni_darrere"
              name="dni_darrere"
              label="Cara posterior"
              sublabel="(obligatòria)"
              hasError={!!state?.errors?.dni_darrere}
              errors={state?.errors?.dni_darrere}
              hint="JPG, PNG o WebP · màx. 5 MB"
            />
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
              defaultValue={v.adreca}
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
              defaultValue={v.telefon}
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
              defaultChecked={v.consentiment_privacitat === 'on'}
              aria-invalid={!!state?.errors?.consentiment_privacitat}
            />
            <div className="space-y-1">
              <Label
                htmlFor="consentiment_privacitat"
                className="text-sm leading-snug cursor-pointer"
              >
                Accepto la{' '}
                <a
                  href="/privacitat"
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
              id="consentiment_reglament"
              name="consentiment_reglament"
              value="on"
              defaultChecked={v.consentiment_reglament === 'on'}
              aria-invalid={!!state?.errors?.consentiment_reglament}
            />
            <div className="space-y-1">
              <Label
                htmlFor="consentiment_reglament"
                className="text-sm leading-snug cursor-pointer"
              >
                He llegit i accepto el{' '}
                <a
                  href="/reglament"
                  className="underline underline-offset-4"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  reglament de règim intern
                </a>{' '}
                del club. (Obligatori)
              </Label>
              <FieldError errors={state?.errors} field="consentiment_reglament" />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="consentiment_comunicacions"
              name="consentiment_comunicacions"
              value="on"
              defaultChecked={v.consentiment_comunicacions === 'on'}
            />
            <Label
              htmlFor="consentiment_comunicacions"
              className="text-sm leading-snug cursor-pointer"
            >
              Accepto rebre comunicacions del club (informació d&apos;entrenaments,
              convocatòries i activitats). (Opcional)
            </Label>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="compromis_desplacaments"
              name="compromis_desplacaments"
              value="on"
              checked={compromisDeplasaments}
              onCheckedChange={(checked) => {
                setCompromisDeplasaments(!!checked)
                if (checked) setAvisVisible(false)
              }}
            />
            <div className="space-y-1">
              <Label
                htmlFor="compromis_desplacaments"
                className="text-sm leading-snug cursor-pointer"
              >
                Em comprometo a portar el meu fill/a als desplaçaments per jugar partits
                fora del municipi. (Opcional)
              </Label>
            </div>
          </div>

          {avisVisible && !compromisDeplasaments && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 space-y-2 dark:border-amber-700 dark:bg-amber-950/30">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Atenció: no heu marcat el compromís de desplaçaments
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                No marcar aquest camp pot comportar que el club denegui la sol·licitud
                d&apos;inscripció al futbol base.
              </p>
              <button
                type="submit"
                className="text-xs font-medium text-amber-800 underline underline-offset-2 hover:text-amber-900 dark:text-amber-200"
              >
                Entenc, enviar la sol·licitud igualment
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Avís quota ── */}
      <div className="rounded-lg border border-muted bg-muted/30 p-4 text-sm text-muted-foreground">
        Un cop enviada la sol·licitud, el club la revisarà i t&apos;avisarà per correu.
        Si és aprovada, rebràs un enllaç per pagar la quota del jugador{' '}
        <strong className="text-foreground">({preuDefecteEuros} €/temporada)</strong>.
      </div>

      {/* ── Enviar ── */}
      <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
        {pending ? 'Enviant sol·licitud…' : 'Enviar sol·licitud'}
      </Button>
    </form>
  )
}
