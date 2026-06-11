'use client'

import { useActionState } from 'react'
import { editarSociAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2 } from 'lucide-react'

type Props = {
  sociId: string
  defaults: {
    nom: string
    cognom1: string
    cognom2: string | null
    email: string | null
    telefon: string | null
    data_naixement: string | null
    adreca: string | null
    codi_postal: string | null
    poblacio: string | null
    genere: string | null
    talla_samarreta: string | null
  }
}

const TALLES = ['Miss', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']
const GENERES = [
  { value: 'home', label: 'Home' },
  { value: 'dona', label: 'Dona' },
  { value: 'no_binari', label: 'No binari' },
  { value: 'ns_nc', label: 'Prefereixo no dir-ho' },
]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

export function EditarSociForm({ sociId, defaults: d }: Props) {
  const action = editarSociAction.bind(null, sociId)
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nom">
          <Input name="nom" defaultValue={d.nom} required />
        </Field>
        <Field label="Primer cognom">
          <Input name="cognom1" defaultValue={d.cognom1} required />
        </Field>
        <Field label="Segon cognom">
          <Input name="cognom2" defaultValue={d.cognom2 ?? ''} />
        </Field>
        <Field label="Data de naixement">
          <Input name="data_naixement" type="date" defaultValue={d.data_naixement ?? ''} />
        </Field>
        <Field label="Correu electrònic">
          <Input name="email" type="email" defaultValue={d.email ?? ''} />
        </Field>
        <Field label="Telèfon">
          <Input name="telefon" defaultValue={d.telefon ?? ''} />
        </Field>
        <Field label="Adreça">
          <Input name="adreca" defaultValue={d.adreca ?? ''} />
        </Field>
        <div className="grid grid-cols-2 gap-2 sm:col-span-1">
          <Field label="Codi postal">
            <Input name="codi_postal" defaultValue={d.codi_postal ?? ''} />
          </Field>
          <Field label="Població">
            <Input name="poblacio" defaultValue={d.poblacio ?? ''} />
          </Field>
        </div>
        <Field label="Gènere">
          <select
            name="genere"
            defaultValue={d.genere ?? ''}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">— Sense especificar —</option>
            {GENERES.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Talla samarreta">
          <select
            name="talla_samarreta"
            defaultValue={d.talla_samarreta ?? ''}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">— Sense especificar —</option>
            {TALLES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>

      <p className="text-xs text-muted-foreground">
        El soci rebrà un correu de notificació informant que les seves dades han estat actualitzades.
      </p>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? 'Desant…' : 'Desar canvis'}
        </Button>
        {state?.success && (
          <span className="flex items-center gap-1.5 text-sm text-green-600">
            <CheckCircle2 className="size-4" />
            Desat
          </span>
        )}
      </div>
    </form>
  )
}
