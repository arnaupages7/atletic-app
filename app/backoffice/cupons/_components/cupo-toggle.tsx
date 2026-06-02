'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toggleCupoAction } from '../nou/actions'

export function CupoToggle({ id, actiu }: { id: string; actiu: boolean }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const handleClick = () => {
    startTransition(async () => {
      await toggleCupoAction(id, actiu)
      router.refresh()
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={handleClick}
      className={actiu ? 'text-destructive' : 'text-green-600'}
    >
      {actiu ? 'Desactivar' : 'Activar'}
    </Button>
  )
}
