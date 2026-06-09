'use client'

import { useTransition, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreditCard, Smartphone, Loader2 } from 'lucide-react'
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
  const [metode, setMetode] = useState<'card' | 'bizum' | 'klarna'>('card')

  const importKlarna = importAmbKlarna(importBase)
  const importPerQuota = Math.ceil(importKlarna / 3)

  function handleClick() {
    startTransition(async () => {
      const result = await pagarQuotaJugadorAction(jugadorId, metode)
      if (result?.error) alert(result.error)
    })
  }

  const opcions: { id: typeof metode; label: string; preu: string; descripcio: string }[] = [
    {
      id: 'card',
      label: 'Targeta',
      preu: fmt(importBase),
      descripcio: 'Visa, Mastercard…',
    },
    {
      id: 'bizum',
      label: 'Bizum',
      preu: fmt(importBase),
      descripcio: 'Pagament mòbil',
    },
    {
      id: 'klarna',
      label: 'En 3 quotes',
      preu: `${fmt(importPerQuota)}/mes`,
      descripcio: `Total ${fmt(importKlarna)} · Klarna`,
    },
  ]

  return (
    <div className="space-y-3">
      {/* Selector de mètode de pagament */}
      <div className="grid grid-cols-3 gap-2">
        {opcions.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setMetode(o.id)}
            className={cn(
              'rounded-lg border p-3 text-left transition-all',
              metode === o.id
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border hover:border-muted-foreground/40'
            )}
          >
            <p className="text-xs font-medium text-muted-foreground mb-0.5">{o.label}</p>
            <p className="text-sm font-semibold leading-tight">{o.preu}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{o.descripcio}</p>
          </button>
        ))}
      </div>

      <Button
        size="sm"
        onClick={handleClick}
        disabled={isPending}
        className="w-full gap-1.5"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : metode === 'bizum' ? (
          <Smartphone className="size-4" />
        ) : (
          <CreditCard className="size-4" />
        )}
        {isPending
          ? 'Preparant pagament…'
          : metode === 'klarna'
            ? 'Pagar en 3 quotes · Klarna'
            : metode === 'bizum'
              ? 'Pagar amb Bizum'
              : 'Pagar amb targeta'}
      </Button>
    </div>
  )
}
