'use client'

import { useActionState, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { crearEquipAction } from '../../actions'
import { slugify } from '../../utils'

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-xs text-destructive mt-1">{msg}</p>
}

export function NouEquipForm({ temporadaActiva }: { temporadaActiva: string }) {
  const [state, action, pending] = useActionState(crearEquipAction, undefined)

  const [nom, setNom] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [preuPerDefecte, setPreuPerDefecte] = useState(true)

  // Auto-omplir slug a partir del nom (si no s'ha editat manualment)
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(nom))
  }, [nom, slugTouched])

  return (
    <form action={action} className="space-y-6 max-w-lg">
      {state?.error && (
        <div role="alert" className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Temporada (oculta, pre-omplerta) */}
      <input type="hidden" name="temporada" value={temporadaActiva} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nom */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="nom">
            Nom <span className="text-destructive">*</span>
          </Label>
          <Input
            id="nom"
            name="nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Benjamí A"
            required
          />
        </div>

        {/* Slug */}
        <div className="space-y-1.5">
          <Label htmlFor="slug">
            Slug <span className="text-muted-foreground font-normal text-xs">(identificador URL)</span>
          </Label>
          <Input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugTouched(true) }}
            placeholder="benjami-a"
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">S&apos;autogenera des del nom. Ha de ser únic.</p>
        </div>

        {/* Categoria */}
        <div className="space-y-1.5">
          <Label htmlFor="categoria">
            Categoria <span className="text-muted-foreground font-normal">(opcional)</span>
          </Label>
          <Input
            id="categoria"
            name="categoria"
            placeholder="Futbol Base"
          />
        </div>

        {/* Preu */}
        <div className="space-y-2 sm:col-span-2">
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="preu_per_defecte"
              name="preu_per_defecte"
              checked={preuPerDefecte}
              onChange={(e) => setPreuPerDefecte(e.target.checked)}
              className="size-4 rounded border-input"
            />
            <div>
              <Label htmlFor="preu_per_defecte" className="cursor-pointer">Usar preu per defecte</Label>
              <p className="text-xs text-muted-foreground">
                S&apos;actualitza automàticament quan canvia el preu per defecte a Configuració.
              </p>
            </div>
          </div>
          {!preuPerDefecte && (
            <div className="flex items-center gap-2 ml-6">
              <Input
                id="preu_inscripcio"
                name="preu_inscripcio"
                type="number"
                min={0}
                step={1}
                placeholder="300"
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">€</span>
            </div>
          )}
        </div>

        {/* Places */}
        <div className="space-y-1.5">
          <Label htmlFor="places_disponibles">
            Places disponibles <span className="text-muted-foreground font-normal">(opcional)</span>
          </Label>
          <Input
            id="places_disponibles"
            name="places_disponibles"
            type="number"
            min={0}
            placeholder="∞ (il·limitades)"
          />
        </div>

        {/* Soci automàtic */}
        <div className="sm:col-span-2 flex items-center gap-2.5 pt-1">
          <input
            type="checkbox"
            id="soci_automatic"
            name="soci_automatic"
            className="size-4 rounded border-input"
          />
          <div>
            <Label htmlFor="soci_automatic" className="cursor-pointer">Soci automàtic</Label>
            <p className="text-xs text-muted-foreground">
              Els jugadors aprovats s&apos;activen directament sense pagament.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending || !nom.trim()} className="gap-1.5">
          {pending && <Loader2 className="size-4 animate-spin" />}
          {pending ? 'Creant…' : 'Crear equip'}
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Cancel·lar
        </Button>
      </div>
    </form>
  )
}
