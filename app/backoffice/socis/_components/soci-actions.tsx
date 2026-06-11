'use client'

import { useTransition, useState } from 'react'
import { baixaSociAction } from '../actions'

export function BaixaSociButton({ sociId }: { sociId: string }) {
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')

  const handleBaixa = () => {
    setError('')
    startTransition(async () => {
      const res = await baixaSociAction(sociId)
      if (res?.error) {
        setError(res.error)
        setConfirming(false)
      }
    })
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-destructive">{error}</span>}
        <span className="text-xs text-muted-foreground">Segur?</span>
        <button
          type="button"
          onClick={handleBaixa}
          disabled={pending}
          className="text-xs font-medium text-destructive hover:underline disabled:opacity-50"
        >
          {pending ? 'Processant…' : 'Sí, baixa'}
        </button>
        <button
          type="button"
          onClick={() => { setConfirming(false); setError('') }}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cancel·lar
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {error && <span className="text-xs text-destructive">{error}</span>}
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
      >
        Donar de baixa
      </button>
    </div>
  )
}
