'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { CreditCard, Loader2 } from 'lucide-react'
import { pagarQuotaJugadorAction } from '../actions'

interface PagarQuotaButtonProps {
  jugadorId: string
}

export function PagarQuotaButton({ jugadorId }: PagarQuotaButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await pagarQuotaJugadorAction(jugadorId)
      if (result?.error) {
        alert(result.error)
      }
      // Si no hi ha error, el server action fa redirect a Stripe
    })
  }

  return (
    <Button
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className="gap-1.5"
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <CreditCard className="size-4" />
      )}
      {isPending ? 'Preparant pagament…' : 'Pagar quota'}
    </Button>
  )
}
