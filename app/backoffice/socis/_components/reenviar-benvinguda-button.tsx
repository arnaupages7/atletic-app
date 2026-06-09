'use client'

import { useTransition, useState } from 'react'
import { Mail, Loader2, Check } from 'lucide-react'
import { reenviarBenvingudaAction } from '../actions'

export function ReenviarBenvingudaButton({ sociId }: { sociId: string }) {
  const [pending, startTransition] = useTransition()
  const [enviat, setEnviat] = useState(false)
  const [error, setError] = useState('')

  const handleClick = () => {
    setError('')
    startTransition(async () => {
      const res = await reenviarBenvingudaAction(sociId)
      if (res?.error) {
        setError(res.error)
      } else {
        setEnviat(true)
        setTimeout(() => setEnviat(false), 3000)
      }
    })
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {error && <span className="text-xs text-destructive">{error}</span>}
      <button
        type="button"
        onClick={handleClick}
        disabled={pending || enviat}
        title="Reenviar correu de benvinguda"
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : enviat ? (
          <Check className="size-3.5 text-green-600" />
        ) : (
          <Mail className="size-3.5" />
        )}
        {enviat ? 'Enviat!' : 'Reenviar correu'}
      </button>
    </div>
  )
}
