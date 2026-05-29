'use client'

import { useTransition, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreditCard, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { importAmbKlarna } from '@/lib/klarna'
import { pagarQuotaJugadorAction } from '../actions'

interface PagarQuotaButtonProps {
  jugadorId: string
  importBase: number // en cèntims
}

const fmt = (cents: number) =>
  new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100)

export function PagarQuotaButton({ jugadorId, importBase }: PagarQuotaButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [metode, setMetode] = useState<'card' | 'klarna'>('card')

  const importKlarna = importAmbKlarna(importBase)
  const importPerQuota = Math.ceil(importKlarna / 3)

  function handleClick() {
    startTransition(async () => {
      const result = await pagarQuotaJugadorAction(jugadorId, metode)
      if (result?.error) alert(result.error)
    })
  }

  return (
    <div className="space-y-3">
      {/* Selector de mètode de pagament */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMetode('card')}
          className={cn(
            'rounded-lg border p-3 text-left transition-all',
            metode === 'card'
              ? 'border-primary bg-primary/5 ring-1 ring-primary'
              : 'border-border hover:border-muted-foreground/40'
          )}
        >
          <p className="text-xs font-medium text-muted-foreground mb-0.5">Al comptat</p>
          <p className="text-base font-semibold">{fmt(importBase)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Pagament únic</p>
        </button>

        <button
          type="button"
          onClick={() => setMetode('klarna')}
          className={cn(
            'rounded-lg border p-3 text-left transition-all',
            metode === 'klarna'
              ? 'border-primary bg-primary/5 ring-1 ring-primary'
              : 'border-border hover:border-muted-foreground/40'
          )}
        >
          <p className="text-xs font-medium text-muted-foreground mb-0.5">En 3 quotes</p>
          <p className="text-base font-semibold">
            {fmt(importPerQuota)}
            <span className="text-xs font-normal text-muted-foreground">/mes</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Total {fmt(importKlarna)} · via Klarna</p>
        </button>
      </div>

      <Button
        size="sm"
        onClick={handleClick}
        disabled={isPending}
        className="w-full gap-1.5"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <CreditCard className="size-4" />
        )}
        {isPending
          ? 'Preparant pagament…'
          : metode === 'klarna'
            ? 'Pagar en 3 quotes · Klarna'
            : 'Pagar al comptat'}
      </Button>
    </div>
  )
}
