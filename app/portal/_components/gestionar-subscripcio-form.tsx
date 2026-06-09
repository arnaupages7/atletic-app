'use client'

import { useActionState } from 'react'
import { gestionarSubscripcioAction } from '../actions'
import { Loader2, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export function GestionarSubscripcioForm() {
  const [state, action, pending] = useActionState(gestionarSubscripcioAction, undefined)

  return (
    <form action={action}>
      {state?.error && (
        <p className="text-xs text-red-300 mb-2">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className={cn(
          buttonVariants({ variant: 'secondary', size: 'sm' }),
          'gap-1.5 bg-white/10 hover:bg-white/20 text-white border-0'
        )}
      >
        {pending
          ? <Loader2 className="size-3.5 animate-spin" />
          : <Settings className="size-3.5" />
        }
        Gestionar subscripció
      </button>
    </form>
  )
}
