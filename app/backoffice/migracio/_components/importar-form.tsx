'use client'

import { useActionState, useState } from 'react'
import { importarMigracioAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, AlertCircle, Upload, FileSpreadsheet, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ImportarForm() {
  const [state, action, pending] = useActionState(importarMigracioAction, undefined)
  const [nomFitxer, setNomFitxer] = useState<string | null>(null)

  return (
    <form action={action} encType="multipart/form-data" className="space-y-4">
      {/* Zona upload */}
      <div className="space-y-1.5">
        <label htmlFor="fitxer" className="text-sm font-medium">
          Fitxer de socis
        </label>
        <p className="text-xs text-muted-foreground">
          Columnes: <code className="bg-muted px-1 rounded">DNI · Núm. soci · Nom (opcional) · Cognom (opcional)</code>.
          La primera fila s&apos;ignora si és una capçalera.
          Formats acceptats: <strong>.xlsx</strong>, <strong>.xls</strong>, <strong>.csv</strong>
        </p>

        <label
          htmlFor="fitxer"
          className={cn(
            'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 cursor-pointer min-h-[120px]',
            'hover:bg-muted/50 transition-colors',
            'error' in (state ?? {}) ? 'border-destructive' : 'border-border',
            nomFitxer && 'bg-muted/30 border-solid border-primary/30'
          )}
        >
          {nomFitxer ? (
            <>
              <FileSpreadsheet className="size-8 text-primary shrink-0" />
              <span className="text-sm font-medium text-foreground text-center break-all max-w-full">
                {nomFitxer}
              </span>
              <span
                role="button"
                onClick={(e) => {
                  e.preventDefault()
                  setNomFitxer(null)
                  const input = document.getElementById('fitxer') as HTMLInputElement
                  if (input) input.value = ''
                }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
              >
                <X className="size-3" />
                Treure
              </span>
            </>
          ) : (
            <>
              <Upload className="size-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">Clica per seleccionar o arrossega aquí</p>
                <p className="text-xs text-muted-foreground mt-0.5">.xlsx · .xls · .csv</p>
              </div>
            </>
          )}
        </label>
        <input
          id="fitxer"
          name="fitxer"
          type="file"
          accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
          className="sr-only"
          onChange={(e) => setNomFitxer(e.target.files?.[0]?.name ?? null)}
        />
      </div>

      {/* Error general */}
      {'error' in (state ?? {}) && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {(state as { error: string }).error}
        </div>
      )}

      {/* Resultat importació */}
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
                  {s.errors.length} {s.errors.length === 1 ? 'fila ignorada' : 'files ignorades'}:
                </p>
                <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-0.5">
                  {s.errors.map((e) => (
                    <li key={e.linia}>Fila {e.linia}: {e.missatge}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      })()}

      <Button type="submit" disabled={pending || !nomFitxer}>
        {pending && <Loader2 className="size-4 mr-2 animate-spin" />}
        Importar
      </Button>
    </form>
  )
}
