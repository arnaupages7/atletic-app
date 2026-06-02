'use client'

import { useActionState, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { registreAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DateSelect } from '@/components/ui/date-select'
import { ShieldAlert } from 'lucide-react'

function FieldError({ errors, field }: { errors?: Record<string, string[]>; field: string }) {
  const msgs = errors?.[field]
  if (!msgs?.length) return null
  return <p className="text-xs text-destructive mt-1">{msgs[0]}</p>
}

function Field({
  label,
  id,
  children,
  required,
  errors,
}: {
  label: string
  id: string
  children: React.ReactNode
  required?: boolean
  errors?: Record<string, string[]>
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      <FieldError errors={errors} field={id} />
    </div>
  )
}

const TALLES = ['Miss', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] as const
const GENERES = [
  { value: 'home', label: 'Home' },
  { value: 'dona', label: 'Dona' },
  { value: 'no_binari', label: 'No binari' },
  { value: 'ns_nc', label: 'Prefereixo no dir-ho' },
]

function calcularEdat(isoDate: string): number {
  const avui = new Date()
  const naix = new Date(isoDate)
  let edat = avui.getFullYear() - naix.getFullYear()
  const m = avui.getMonth() - naix.getMonth()
  if (m < 0 || (m === 0 && avui.getDate() < naix.getDate())) edat--
  return edat
}

export function RegistreForm() {
  const [state, action, pending] = useActionState(registreAction, undefined)
  const errors = state?.errors
  const v = state?.values ?? {}

  // Data de naixement — per calcular si és menor
  const [dataNaixement, setDataNaixement] = useState(v.data_naixement ?? '')
  const esMenor = dataNaixement ? calcularEdat(dataNaixement) < 18 : false

  // Select controlat per al rol del tutor
  const [tutorRelacio, setTutorRelacio] = useState(v.tutor_relacio ?? '')

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-8">
      <div className="mb-8 text-center flex flex-col items-center gap-3">
        <Image
          src="/logo.png"
          alt="Atlètic Club Banyoles"
          width={80}
          height={80}
        />
        <div>
          <h1 className="text-xl font-semibold">Alta de soci</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quota anual: <strong>25 €</strong>
          </p>
        </div>
      </div>

      {state?.error && (
        <div
          role="alert"
          className="mb-6 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {state.error}
        </div>
      )}

      <form key={state?.timestamp ?? 0} action={action} className="space-y-8">
        {/* ── Compte ── */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold">Compte</h2>
            <p className="text-xs text-muted-foreground">Servirà per accedir al portal del soci</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Correu electrònic" id="email" required errors={errors}>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="nom@exemple.cat"
                defaultValue={v.email}
                aria-invalid={!!errors?.email}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contrasenya" id="password" required errors={errors}>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors?.password}
              />
            </Field>
            <Field label="Confirma la contrasenya" id="password_confirm" required errors={errors}>
              <Input
                id="password_confirm"
                name="password_confirm"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors?.password_confirm}
              />
            </Field>
          </div>
        </section>

        <Separator />

        {/* ── Dades personals ── */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold">Dades personals</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom" id="nom" required errors={errors}>
              <Input
                id="nom"
                name="nom"
                autoComplete="given-name"
                defaultValue={v.nom}
                aria-invalid={!!errors?.nom}
              />
            </Field>
            <Field label="Primer cognom" id="cognom1" required errors={errors}>
              <Input
                id="cognom1"
                name="cognom1"
                autoComplete="family-name"
                defaultValue={v.cognom1}
                aria-invalid={!!errors?.cognom1}
              />
            </Field>
            <Field label="Segon cognom" id="cognom2" errors={errors}>
              <Input id="cognom2" name="cognom2" autoComplete="additional-name" defaultValue={v.cognom2} />
            </Field>
            <Field label="DNI / NIE" id="dni" required errors={errors}>
              <Input
                id="dni"
                name="dni"
                placeholder="12345678A"
                defaultValue={v.dni}
                aria-invalid={!!errors?.dni}
              />
            </Field>
            <Field label="Data de naixement" id="data_naixement" required errors={errors}>
              <DateSelect
                name="data_naixement"
                defaultValue={v.data_naixement}
                maxYear={new Date().getFullYear()}
                invalid={!!errors?.data_naixement}
                onDateChange={setDataNaixement}
              />
            </Field>
            <Field label="Gènere" id="genere" errors={errors}>
              <Select name="genere" defaultValue={v.genere}>
                <SelectTrigger id="genere">
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                  {GENERES.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Talla samarreta" id="talla_samarreta" errors={errors}>
              <Select name="talla_samarreta" defaultValue={v.talla_samarreta}>
                <SelectTrigger id="talla_samarreta">
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                  {TALLES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </section>

        <Separator />

        {/* ── Contacte ── */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold">Contacte</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Telèfon" id="telefon" required errors={errors}>
              <Input
                id="telefon"
                name="telefon"
                type="tel"
                autoComplete="tel"
                placeholder="600 000 000"
                defaultValue={v.telefon}
                aria-invalid={!!errors?.telefon}
              />
            </Field>
          </div>
          <Field label="Adreça" id="adreca" required errors={errors}>
            <Input
              id="adreca"
              name="adreca"
              autoComplete="street-address"
              defaultValue={v.adreca}
              aria-invalid={!!errors?.adreca}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Codi postal" id="codi_postal" required errors={errors}>
              <Input
                id="codi_postal"
                name="codi_postal"
                autoComplete="postal-code"
                placeholder="17820"
                defaultValue={v.codi_postal}
                aria-invalid={!!errors?.codi_postal}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Població" id="poblacio" required errors={errors}>
                <Input
                  id="poblacio"
                  name="poblacio"
                  autoComplete="address-level2"
                  placeholder="Banyoles"
                  defaultValue={v.poblacio}
                  aria-invalid={!!errors?.poblacio}
                />
              </Field>
            </div>
          </div>
        </section>

        {/* ── Representant legal (només si menor de 18) ── */}
        {esMenor && (
          <>
            <Separator />
            <section className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
                <ShieldAlert className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    El soci és menor de 18 anys
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                    Cal el consentiment d&apos;un representant legal per formalitzar l&apos;alta.
                  </p>
                </div>
              </div>

              <h2 className="text-base font-semibold">Representant legal</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nom complet del representant" id="tutor_nom" required errors={errors}>
                  <Input
                    id="tutor_nom"
                    name="tutor_nom"
                    autoComplete="off"
                    defaultValue={v.tutor_nom}
                    aria-invalid={!!errors?.tutor_nom}
                  />
                </Field>
                <Field label="DNI / NIE del representant" id="tutor_dni" required errors={errors}>
                  <Input
                    id="tutor_dni"
                    name="tutor_dni"
                    placeholder="12345678A"
                    defaultValue={v.tutor_dni}
                    aria-invalid={!!errors?.tutor_dni}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Relació amb el menor" id="tutor_relacio" required errors={errors}>
                    <Select
                      name="tutor_relacio"
                      value={tutorRelacio}
                      onValueChange={(val) => setTutorRelacio(val ?? '')}
                    >
                      <SelectTrigger id="tutor_relacio" aria-invalid={!!errors?.tutor_relacio}>
                        <SelectValue placeholder="Selecciona…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pare_mare">Pare / Mare</SelectItem>
                        <SelectItem value="tutor_legal">Tutor/a legal</SelectItem>
                        <SelectItem value="altre">Altre representant legal</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="consentiment_tutor"
                  name="consentiment_tutor"
                  defaultChecked={v.consentiment_tutor === 'on'}
                  aria-invalid={!!errors?.consentiment_tutor}
                />
                <div className="space-y-1">
                  <Label htmlFor="consentiment_tutor" className="text-sm leading-snug cursor-pointer">
                    Com a representant legal del menor, autoritzo l&apos;alta com a soci i el tractament
                    de les seves dades personals per part de l&apos;Atlètic Club Banyoles,
                    d&apos;acord amb la{' '}
                    <Link href="/privacitat" className="underline underline-offset-2">
                      política de privacitat
                    </Link>. <span className="text-destructive">*</span>
                  </Label>
                  <FieldError errors={errors} field="consentiment_tutor" />
                </div>
              </div>
            </section>
          </>
        )}

        <Separator />

        {/* ── Consentiments ── */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold">Consentiments</h2>

          <div className="flex items-start gap-3">
            <Checkbox
              id="consentiment_privacitat"
              name="consentiment_privacitat"
              defaultChecked={v.consentiment_privacitat === 'on'}
              aria-invalid={!!errors?.consentiment_privacitat}
            />
            <div className="space-y-1">
              <Label htmlFor="consentiment_privacitat" className="text-sm leading-snug cursor-pointer">
                He llegit i accepto la{' '}
                <Link href="/privacitat" className="underline underline-offset-2">
                  política de privacitat
                </Link>{' '}
                <span className="text-destructive">*</span>
              </Label>
              <FieldError errors={errors} field="consentiment_privacitat" />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="consentiment_comunicacions"
              name="consentiment_comunicacions"
              defaultChecked={v.consentiment_comunicacions === 'on'}
            />
            <Label htmlFor="consentiment_comunicacions" className="text-sm leading-snug cursor-pointer">
              Accepto rebre comunicacions i novetats del club per correu electrònic
            </Label>
          </div>
        </section>

        {/* ── Submit ── */}
        <div className="space-y-3">
          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending ? 'Processant…' : 'Continuar al pagament →'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Seràs redirigit a Stripe per completar el pagament de 25 €/any de forma segura.
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Ja ets soci?{' '}
            <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
              Accedeix al portal
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}
