'use client'

import { useTransition, useState } from 'react'
import { baixaSociAction, eliminarSociAction } from '../actions'

type Props = { sociId: string; estatActual: string }

export function AccionsSoci({ sociId, estatActual }: Props) {
  const [pendingBaixa, startBaixa] = useTransition()
  const [pendingEliminar, startEliminar] = useTransition()
  const [confirmBaixa, setConfirmBaixa] = useState(false)
  const [confirmEliminar, setConfirmEliminar] = useState(false)
  const [error, setError] = useState('')

  const handleBaixa = () => {
    setError('')
    startBaixa(async () => {
      const res = await baixaSociAction(sociId)
      if (res?.error) { setError(res.error); setConfirmBaixa(false) }
    })
  }

  const handleEliminar = () => {
    setError('')
    startEliminar(async () => {
      const res = await eliminarSociAction(sociId)
      if (res?.error) { setError(res.error); setConfirmEliminar(false) }
    })
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Donar de baixa */}
      {estatActual !== 'baixa' && (
        <div className="flex items-center gap-3">
          {confirmBaixa ? (
            <>
              <span className="text-sm text-muted-foreground">Segur?</span>
              <button
                type="button"
                onClick={handleBaixa}
                disabled={pendingBaixa}
                className="text-sm font-medium text-destructive hover:underline disabled:opacity-50"
              >
                {pendingBaixa ? 'Processant…' : 'Sí, donar de baixa'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmBaixa(false)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel·lar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmBaixa(true)}
              className="text-sm text-muted-foreground hover:text-amber-600 transition-colors"
            >
              Donar de baixa
            </button>
          )}
        </div>
      )}

      {/* Eliminar */}
      <div className="flex items-center gap-3">
        {confirmEliminar ? (
          <>
            <span className="text-sm font-medium text-destructive">
              Això eliminarà el soci permanentment. Segur?
            </span>
            <button
              type="button"
              onClick={handleEliminar}
              disabled={pendingEliminar}
              className="text-sm font-medium text-destructive hover:underline disabled:opacity-50"
            >
              {pendingEliminar ? 'Eliminant…' : 'Sí, eliminar'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmEliminar(false)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel·lar
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmEliminar(true)}
            className="text-sm text-destructive/70 hover:text-destructive transition-colors"
          >
            Eliminar soci
          </button>
        )}
      </div>
    </div>
  )
}
