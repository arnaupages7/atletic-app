'use client'

import { useActionState, useState } from 'react'
import { Loader2, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { pagarQuotaSociAction } from '../actions'

export function PagarQuotaForm() {
  const [state, action, pending] = useActionState(pagarQuotaSociAction, undefined)
  const [showCupo, setShowCupo] = useState(false)

  return (
    <form action={action} className="space-y-2 mt-2">
      {/* Cupó (desplegable) */}
      {!showCupo ? (
        <button
          type="button"
          onClick={() => setShowCupo(true)}
          className="text-xs text-yellow-700 dark:text-yellow-300 underline underline-offset-2 flex items-center gap-1"
        >
          <Tag className="size-3" />
          Tens un codi de descompte?
        </button>
      ) : (
        <div className="flex gap-2 items-center">
          <Input
            name="codi_cupo"
            placeholder="Codi de cupó"
            className="h-7 text-xs uppercase w-36 bg-white/80 dark:bg-black/20 border-yellow-300"
            style={{ textTransform: 'uppercase' }}
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowCupo(false)}
            className="text-xs text-yellow-600 underline"
          >
            Cancel·lar
          </button>
        </div>
      )}

      {state?.error && (
        <p className="text-xs text-red-700 dark:text-red-400 font-medium">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={cn(
          buttonVariants({ size: 'sm' }),
          'bg-yellow-600 hover:bg-yellow-700 text-white border-0 gap-1.5'
        )}
      >
        {pending && <Loader2 className="size-3.5 animate-spin" />}
        Paga ara (25€/any)
      </button>
    </form>
  )
}
