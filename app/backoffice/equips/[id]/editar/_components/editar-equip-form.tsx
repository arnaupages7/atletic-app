'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { editarEquipAction } from '../../../actions'

type Defaults = {
  nom: string
  slug: string
  categoria: string | null
  preu_inscripcio: number | null
  places_disponibles: number | null
  soci_automatic: boolean
  actiu: boolean
}

export function EditarEquipForm({
  equipId,
  defaults,
}: {
  equipId: string
  defaults: Defaults
}) {
  const boundAction = editarEquipAction.bind(null, equipId)
  const [state, action, pending] = useActionState(boundAction, undefined)

  return (
    <form action={action} className="space-y-6 max-w-lg">
      {state?.error && (
        <div role="alert" className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nom */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="nom">
            Nom <span className="text-destructive">*</span>
          </Label>
          <Input
            id="nom"
            name="nom"
            defaultValue={defaults.nom}
            required
          />
        </div>

        {/* Slug */}
        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            defaultValue={defaults.slug}
            className="font-mono text-sm"
          />
        </div>

        {/* Categoria */}
        <div className="space-y-1.5">
          <Label htmlFor="categoria">
            Categoria <span className="text-muted-foreground font-normal">(opcional)</span>
          </Label>
          <Input
            id="categoria"
            name="categoria"
            defaultValue={defaults.categoria ?? ''}
            placeholder="Futbol Base"
          />
        </div>

        {/* Preu */}
        <div className="space-y-1.5">
          <Label htmlFor="preu_inscripcio">
            Preu <span className="text-muted-foreground font-normal">(cèntims)</span>
          </Label>
          <Input
            id="preu_inscripcio"
            name="preu_inscripcio"
            type="number"
            min={0}
            step={100}
            defaultValue={defaults.preu_inscripcio ?? ''}
            placeholder="30000 = 300 €"
          />
        </div>

        {/* Places */}
        <div className="space-y-1.5">
          <Label htmlFor="places_disponibles">
            Places <span className="text-muted-foreground font-normal">(opcional)</span>
          </Label>
          <Input
            id="places_disponibles"
            name="places_disponibles"
            type="number"
            min={0}
            defaultValue={defaults.places_disponibles ?? ''}
            placeholder="∞"
          />
        </div>

        {/* Soci automàtic */}
        <div className="sm:col-span-2 flex items-center gap-2.5 pt-1">
          <input
            type="checkbox"
            id="soci_automatic"
            name="soci_automatic"
            defaultChecked={defaults.soci_automatic}
            className="size-4 rounded border-input"
          />
          <div>
            <Label htmlFor="soci_automatic" className="cursor-pointer">Soci automàtic</Label>
            <p className="text-xs text-muted-foreground">
              Els jugadors aprovats s&apos;activen directament sense pagament.
            </p>
          </div>
        </div>

        {/* Actiu */}
        <div className="sm:col-span-2 flex items-center gap-2.5">
          <input
            type="checkbox"
            id="actiu"
            name="actiu"
            defaultChecked={defaults.actiu}
            className="size-4 rounded border-input"
          />
          <div>
            <Label htmlFor="actiu" className="cursor-pointer">Equip actiu</Label>
            <p className="text-xs text-muted-foreground">
              Els equips inactius no apareixen al portal d&apos;inscripció.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending} className="gap-1.5">
          {pending && <Loader2 className="size-4 animate-spin" />}
          {pending ? 'Desant…' : 'Desar canvis'}
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Cancel·lar
        </Button>
      </div>
    </form>
  )
}
