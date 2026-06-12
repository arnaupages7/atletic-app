'use client'

import { useTransition, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CreditCard, Smartphone, Loader2, Tag, X } from 'lucide-react'
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
  const [codiCupo, setCodiCupo] = useState('')
  const [cupoError, setCupoError] = useState('')

  const importKlarna = importAmbKlarna(importBase)
  const importPerQuota = Math.ceil(importKlarna / 3)

  function handleClick() {
    setCupoError('')
    startTransition(async () => {
      const result = await pagarQuotaJugadorAction(jugadorId, metode, codiCupo)
      if (result?.error) {
        // Si l'error és del cupó, mostrar-lo al camp de cupó
        if (result.error.toLowerCase().includes('cupó')) {
          setCupoError(result.error)
        } else {
          alert(result.error)
        }
      }
    })
  }

  const opcions: { id: typeof metode; label: string; preu: string; descripcio: string }[] = [
    {
      id: 'card',
      label: 'Pagar ara',
      preu: fmt(importBase),
      descripcio: 'Targeta, Bizum…',
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
      <div className="grid grid-cols-2 gap-2">
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

      {/* Camp de cupó de descompte */}
      <div className="space-y-1">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Codi de descompte (opcional)"
              value={codiCupo}
              onChange={(e) => {
                setCodiCupo(e.target.value.toUpperCase())
                if (cupoError) setCupoError('')
              }}
              className={cn(
                'pl-8 uppercase text-sm h-9',
                cupoError && 'border-destructive focus-visible:ring-destructive'
              )}
              disabled={isPending}
              maxLength={30}
            />
            {codiCupo && (
              <button
                type="button"
                onClick={() => { setCodiCupo(''); setCupoError('') }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>
        {cupoError && (
          <p className="text-xs text-destructive">{cupoError}</p>
        )}
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
