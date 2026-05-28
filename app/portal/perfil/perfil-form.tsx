'use client'

import { useActionState } from 'react'
import { actualitzarPerfilAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle2 } from 'lucide-react'

type PerfilData = {
  nom: string
  cognom1: string
  cognom2: string | null
  email: string | null
  telefon: string | null
  data_naixement: string | null
  dni: string | null
  adreca: string | null
  codi_postal: string | null
  poblacio: string | null
  provincia: string | null
  talla_samarreta: string | null
}

const TALLES = ['Miss', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] as const

function FieldError({ errors, field }: { errors?: Record<string, string[]>; field: string }) {
  const msgs = errors?.[field]
  if (!msgs?.length) return null
  return <p className="text-xs text-destructive mt-1">{msgs[0]}</p>
}

export function PerfilForm({ dades }: { dades: PerfilData }) {
  const [state, action, pending] = useActionState(actualitzarPerfilAction, undefined)

  return (
    <form action={action} className="space-y-6">
      {/* Error general */}
      {state?.error && (
        <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Èxit */}
      {state?.success && (
        <div role="status" className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-400">
          <CheckCircle2 className="size-4 shrink-0" />
          Perfil actualitzat correctament.
        </div>
      )}

      {/* Dades personals */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Dades personals
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="nom">Nom</Label>
            <Input
              id="nom"
              name="nom"
              defaultValue={dades.nom}
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
              defaultValue={dades.cognom1}
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
            <Input
              id="cognom2"
              name="cognom2"
              defaultValue={dades.cognom2 ?? ''}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="telefon">Telèfon</Label>
            <Input
              id="telefon"
              name="telefon"
              type="tel"
              defaultValue={dades.telefon ?? ''}
              aria-invalid={!!state?.errors?.telefon}
            />
            <FieldError errors={state?.errors} field="telefon" />
          </div>
        </div>

        {/* Camps de només lectura */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Correu electrònic</Label>
            <Input value={dades.email ?? ''} readOnly className="bg-muted/50 cursor-not-allowed" />
            <p className="text-xs text-muted-foreground">
              Per canviar el correu, contacta amb el club.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-muted-foreground">DNI / NIE</Label>
            <Input value={dades.dni ?? ''} readOnly className="bg-muted/50 cursor-not-allowed" />
          </div>

          {dades.data_naixement && (
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Data de naixement</Label>
              <Input
                value={new Intl.DateTimeFormat('ca-ES').format(new Date(dades.data_naixement))}
                readOnly
                className="bg-muted/50 cursor-not-allowed"
              />
            </div>
          )}
        </div>
      </div>

      {/* Adreça */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Adreça postal
        </h3>

        <div className="space-y-1.5">
          <Label htmlFor="adreca">Adreça</Label>
          <Input
            id="adreca"
            name="adreca"
            defaultValue={dades.adreca ?? ''}
            placeholder="Carrer de les Flors, 12, 3r 2a"
            aria-invalid={!!state?.errors?.adreca}
            required
          />
          <FieldError errors={state?.errors} field="adreca" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="codi_postal">Codi postal</Label>
            <Input
              id="codi_postal"
              name="codi_postal"
              defaultValue={dades.codi_postal ?? ''}
              placeholder="17820"
              maxLength={5}
              aria-invalid={!!state?.errors?.codi_postal}
              required
            />
            <FieldError errors={state?.errors} field="codi_postal" />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="poblacio">Població</Label>
            <Input
              id="poblacio"
              name="poblacio"
              defaultValue={dades.poblacio ?? ''}
              aria-invalid={!!state?.errors?.poblacio}
              required
            />
            <FieldError errors={state?.errors} field="poblacio" />
          </div>

          <div className="space-y-1.5 col-span-2 sm:col-span-3">
            <Label htmlFor="provincia">
              Província{' '}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="provincia"
              name="provincia"
              defaultValue={dades.provincia ?? ''}
            />
          </div>
        </div>
      </div>

      {/* Preferències */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Preferències
        </h3>

        <div className="space-y-1.5 max-w-xs">
          <Label htmlFor="talla_samarreta">Talla de samarreta</Label>
          <Select name="talla_samarreta" defaultValue={dades.talla_samarreta ?? ''}>
            <SelectTrigger id="talla_samarreta">
              <SelectValue placeholder="Selecciona talla" />
            </SelectTrigger>
            <SelectContent>
              {TALLES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Desar */}
      <div className="pt-2">
        <Button type="submit" disabled={pending} size="lg">
          {pending ? 'Desant…' : 'Desar canvis'}
        </Button>
      </div>
    </form>
  )
}
