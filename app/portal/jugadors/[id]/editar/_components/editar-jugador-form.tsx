'use client'

import { useActionState, useState } from 'react'
import { editarJugadorAction } from '../actions'
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
import { Save } from 'lucide-react'
type CheckedState = boolean | 'indeterminate'

type Defaults = {
  nom: string
  cognom1: string
  cognom2: string
  data_naixement: string
  genere?: 'M' | 'F' | 'A'
  talla_samarreta: TallaSamarreta
  adreca: string
  telefon: string
  num_catsalut: string
  consentiment_comunicacions: boolean
}

const TALLES = ['5-6', '6-8', '8-10', '10-12', '12-14', 'Miss', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] as const
type TallaSamarreta = typeof TALLES[number]

function FieldError({ errors, field }: { errors?: Record<string, string[]>; field: string }) {
  const msgs = errors?.[field]
  if (!msgs?.length) return null
  return <p className="text-xs text-destructive mt-1">{msgs[0]}</p>
}

export function EditarJugadorForm({
  jugadorId,
  defaults,
}: {
  jugadorId: string
  defaults: Defaults
}) {
  const boundAction = editarJugadorAction.bind(null, jugadorId)
  const [state, action, pending] = useActionState(boundAction, undefined)

  const [talla, setTalla] = useState(defaults.talla_samarreta)
  const [genere, setGenere] = useState(defaults.genere ?? '')
  const GENERE_LABELS: Record<string, string> = { M: 'Masculí', F: 'Femení', A: 'Altre / no especificat' }
  const [comunicacions, setComunicacions] = useState(defaults.consentiment_comunicacions)

  return (
    <form action={action} className="space-y-8">
      {state?.error && (
        <div role="alert" className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Dades personals */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Dades personals</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="nom">Nom</Label>
            <Input
              id="nom"
              name="nom"
              defaultValue={defaults.nom}
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
              defaultValue={defaults.cognom1}
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
            <Input id="cognom2" name="cognom2" defaultValue={defaults.cognom2} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="data_naixement">Data de naixement</Label>
            <DateSelect
              name="data_naixement"
              defaultValue={defaults.data_naixement}
              maxYear={new Date().getFullYear() - 4}
              invalid={!!state?.errors?.data_naixement}
            />
            <FieldError errors={state?.errors} field="data_naixement" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="genere">Gènere</Label>
            <Select name="genere" value={genere} onValueChange={(v) => setGenere(v ?? '')}>
              <SelectTrigger id="genere">
                <SelectValue placeholder="Selecciona…">{GENERE_LABELS[genere]}</SelectValue>
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

      {/* Inscripció esportiva */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Inscripció esportiva</h2>
        <div className="space-y-1.5 max-w-xs">
          <Label htmlFor="talla_samarreta">Talla de samarreta</Label>
          <Select name="talla_samarreta" value={talla} onValueChange={(v) => setTalla(v as typeof talla)}>
            <SelectTrigger id="talla_samarreta" aria-invalid={!!state?.errors?.talla_samarreta}>
              <SelectValue placeholder="Selecciona talla…">{talla || undefined}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TALLES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={state?.errors} field="talla_samarreta" />
        </div>
      </section>

      <Separator />

      {/* Informació mèdica */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Informació mèdica</h2>
        <div className="space-y-1.5 max-w-xs">
          <Label htmlFor="num_catsalut">Número targeta CATSalut</Label>
          <Input
            id="num_catsalut"
            name="num_catsalut"
            placeholder="1234567890A"
            defaultValue={defaults.num_catsalut}
            aria-invalid={!!state?.errors?.num_catsalut}
          />
          <FieldError errors={state?.errors} field="num_catsalut" />
        </div>
      </section>

      <Separator />

      {/* Contacte */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Adreça i contacte</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="adreca">Adreça</Label>
            <Input
              id="adreca"
              name="adreca"
              defaultValue={defaults.adreca}
              aria-invalid={!!state?.errors?.adreca}
            />
            <FieldError errors={state?.errors} field="adreca" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="telefon">Telèfon</Label>
            <Input
              id="telefon"
              name="telefon"
              type="tel"
              placeholder="600 000 000"
              defaultValue={defaults.telefon}
              aria-invalid={!!state?.errors?.telefon}
            />
            <FieldError errors={state?.errors} field="telefon" />
          </div>
        </div>
      </section>

      <Separator />

      {/* Consentiments */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Comunicacions</h2>
        {/* Hidden input per garantir l'enviament correcte */}
        <input type="hidden" name="consentiment_comunicacions" value={comunicacions ? 'on' : ''} />
        <div className="flex items-start gap-3">
          <Checkbox
            id="consentiment_comunicacions"
            checked={comunicacions}
            onCheckedChange={(v: CheckedState) => setComunicacions(v === true)}
          />
          <Label htmlFor="consentiment_comunicacions" className="text-sm leading-snug cursor-pointer">
            Accepto rebre comunicacions del club (informació d&apos;entrenaments,
            convocatòries i activitats). (Opcional)
          </Label>
        </div>
      </section>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending} className="gap-1.5">
          <Save className="size-4" />
          {pending ? 'Desant…' : 'Desar canvis'}
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Cancel·lar
        </Button>
      </div>
    </form>
  )
}
