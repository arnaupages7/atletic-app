'use client'

import { useTransition } from 'react'
import { toggleActiuGestorAction, canviarRolGestorAction } from '../actions'

interface GestorActionsProps {
  gestorId: string
  actiu: boolean
  rol: 'admin' | 'gestor'
  esTuMateix: boolean
}

export function GestorActions({ gestorId, actiu, rol, esTuMateix }: GestorActionsProps) {
  const [pendingToggle, startToggle] = useTransition()
  const [pendingRol, startRol] = useTransition()

  function handleToggle() {
    startToggle(async () => {
      const res = await toggleActiuGestorAction(gestorId, !actiu)
      if (res?.error) alert(res.error)
    })
  }

  function handleRol() {
    const nouRol = rol === 'admin' ? 'gestor' : 'admin'
    const confirmMsg = `Canviar rol a "${nouRol}"?`
    if (!confirm(confirmMsg)) return
    startRol(async () => {
      const res = await canviarRolGestorAction(gestorId, nouRol)
      if (res?.error) alert(res.error)
    })
  }

  if (esTuMateix) {
    return <span className="text-xs text-muted-foreground italic">Tu mateix</span>
  }

  return (
    <div className="flex items-center gap-2 justify-end">
      <button
        onClick={handleRol}
        disabled={pendingRol}
        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 disabled:opacity-50"
      >
        {pendingRol ? '…' : rol === 'admin' ? 'Fer gestor' : 'Fer admin'}
      </button>
      <button
        onClick={handleToggle}
        disabled={pendingToggle}
        className={`text-xs font-medium underline underline-offset-4 disabled:opacity-50 ${
          actiu ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'
        }`}
      >
        {pendingToggle ? '…' : actiu ? 'Desactivar' : 'Activar'}
      </button>
    </div>
  )
}
