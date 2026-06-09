'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import { toggleCupoAction, eliminarCupoAction } from '../nou/actions'

export function CupoActions({
  id,
  actiu,
}: {
  id: string
  actiu: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const router = useRouter()

  const handleToggle = () => {
    startTransition(async () => {
      await toggleCupoAction(id, actiu)
      router.refresh()
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const res = await eliminarCupoAction(id)
      if (res?.error) {
        alert(res.error)
        setConfirming(false)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      {/* Editar */}
      <Button variant="ghost" size="icon" className="size-8" asChild>
        <Link href={`/backoffice/cupons/${id}/editar`}>
          <Pencil className="size-3.5" />
          <span className="sr-only">Editar</span>
        </Link>
      </Button>

      {/* Activar / Desactivar */}
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={handleToggle}
        className={actiu ? 'text-destructive' : 'text-green-600'}
      >
        {actiu ? 'Desactivar' : 'Activar'}
      </Button>

      {/* Eliminar — amb confirmació inline */}
      {confirming ? (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-destructive font-medium">Segur?</span>
          <Button
            variant="destructive"
            size="sm"
            disabled={pending}
            onClick={handleDelete}
          >
            Sí, eliminar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => setConfirming(false)}
          >
            Cancel·lar
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => setConfirming(true)}
          disabled={pending}
        >
          <Trash2 className="size-3.5" />
          <span className="sr-only">Eliminar</span>
        </Button>
      )}
    </div>
  )
}
