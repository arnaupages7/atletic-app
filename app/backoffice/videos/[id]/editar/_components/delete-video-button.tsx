'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

export function DeleteVideoButton({
  action,
  titol,
}: {
  action: () => Promise<{ error?: string }>
  titol: string
}) {
  const [pending, startTransition] = useTransition()

  const handleClick = () => {
    if (!confirm(`Segur que vols eliminar el vídeo "${titol}"? Aquesta acció no es pot desfer.`)) return
    startTransition(async () => {
      await action()
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
      disabled={pending}
      onClick={handleClick}
    >
      <Trash2 className="size-3.5" />
      {pending ? 'Eliminant…' : 'Eliminar'}
    </Button>
  )
}
