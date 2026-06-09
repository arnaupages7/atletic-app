'use client'

import { useActionState, useState, useEffect } from 'react'
import { ajustarSequenciaAction, esborrarPendentsAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react'

export function SequenciaForm({
  maxReservat,
  sequenciaDesada,
}: {
  maxReservat: number
  sequenciaDesada: number | null
}) {
  const suggerit = sequenciaDesada ?? (maxReservat > 0 ? maxReservat + 1 : 1)
  const [valor, setValor] = useState(suggerit)

  const [state, action, pending] = useActionState(ajustarSequenciaAction, undefined)

  // Quan s'assigna correctament, actualitza el valor mostrat
  useEffect(() => {
    if (state && 'success' in state) {
      setValor((state as { inici: number }).inici)
    }
  }, [state])

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5 max-w-xs">
        <Label htmlFor="inici">Primer número per a nous socis</Label>
        <p className="text-xs text-muted-foreground">
          Socis que no tinguin DNI a la taula de migració rebran números a partir d&apos;aquest valor.
          {maxReservat > 0 && (
            <> El número més alt reservat és <strong>#{maxReservat}</strong>.</>
          )}
        </p>
        <Input
          id="inici"
          name="inici"
          type="number"
          min={1}
          value={valor}
          onChange={(e) => setValor(parseInt(e.target.value) || 1)}
          className="font-mono"
        />
      </div>

      {'error' in (state ?? {}) && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {(state as { error: string }).error}
        </div>
      )}

      {'success' in (state ?? {}) && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle2 className="size-4 shrink-0" />
          Seqüència ajustada. El proper soci nou rebrà el #{(state as { inici: number }).inici}.
        </div>
      )}

      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="size-4 mr-2 animate-spin" />}
        Ajustar seqüència
      </Button>
    </form>
  )
}

export function EsborrarPendentsForm({ pendents }: { pendents: number }) {
  const [state, action, pending] = useActionState(esborrarPendentsAction, undefined)

  if (pendents === 0) return null

  return (
    <form action={action}>
      {'error' in (state ?? {}) && (
        <p className="text-sm text-destructive mb-2">
          {(state as { error: string }).error}
        </p>
      )}
      {'success' in (state ?? {}) && (
        <p className="text-sm text-green-600 mb-2">
          {(state as { esborrats: number }).esborrats} registres esborrats.
        </p>
      )}
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={pending}
        className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
      >
        {pending ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Trash2 className="size-4 mr-2" />}
        Esborrar {pendents} registre{pendents !== 1 ? 's' : ''} pendents
      </Button>
    </form>
  )
}
