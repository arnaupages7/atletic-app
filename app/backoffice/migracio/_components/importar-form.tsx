'use client'

import { useActionState } from 'react'
import { importarMigracioAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export function ImportarForm() {
  const [state, action, pending] = useActionState(importarMigracioAction, undefined)

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="csv" className="text-sm font-medium">
          Enganxa les dades (CSV o Excel copiat)
        </label>
        <p className="text-xs text-muted-foreground">
          Format: <code className="bg-muted px-1 rounded text-xs">DNI, número_soci</code> — una fila per línia. Opcionalment pots afegir nom i cognom a les columnes 3 i 4. Accepta separadors <code className="bg-muted px-1 rounded text-xs">,</code> i <code className="bg-muted px-1 rounded text-xs">;</code>. La primera fila s&apos;ignora si és una capçalera.
        </p>
        <textarea
          id="csv"
          name="csv"
          rows={10}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
          placeholder={"DNI,NUM_SOCI,NOM,COGNOM\n12345678A,42,Joan,García\n87654321B,101,Maria,López\n..."}
          spellCheck={false}
        />
      </div>

      {'error' in (state ?? {}) && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {(state as { error: string }).error}
        </div>
      )}

      {'importats' in (state ?? {}) && (() => {
        const s = state as { importats: number; errors: { linia: number; missatge: string }[] }
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-400">
              <CheckCircle2 className="size-4 shrink-0" />
              {s.importats} {s.importats === 1 ? 'registre importat' : 'registres importats'} correctament.
            </div>
            {s.errors.length > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/30">
                <p className="text-xs font-medium text-amber-800 dark:text-amber-200 mb-1">
                  {s.errors.length} {s.errors.length === 1 ? 'linia ignorada' : 'linies ignorades'}:
                </p>
                <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-0.5">
                  {s.errors.map((e) => (
                    <li key={e.linia}>Línia {e.linia}: {e.missatge}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      })()}

      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="size-4 mr-2 animate-spin" />}
        Importar
      </Button>
    </form>
  )
}
