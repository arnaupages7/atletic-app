'use client'

import { useState } from 'react'
import { Upload, X, FileImage } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadZoneProps {
  id: string
  name: string
  label: string
  sublabel?: string
  hasError?: boolean
  accept?: string
  hint?: string
  errors?: string[]
}

export function FileUploadZone({
  id,
  name,
  label,
  sublabel,
  hasError,
  accept = 'image/jpeg,image/png,image/webp',
  hint = 'JPG, PNG o WebP · màx. 5 MB',
  errors,
}: FileUploadZoneProps) {
  const [nomFitxer, setNomFitxer] = useState<string | null>(null)
  const hasAnyError = hasError || (errors && errors.length > 0)

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}{' '}
        {sublabel && <span className="text-muted-foreground font-normal">{sublabel}</span>}
      </label>
      <label
        htmlFor={id}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 cursor-pointer min-h-[100px]',
          'hover:bg-muted/50 transition-colors',
          hasAnyError ? 'border-destructive' : 'border-border',
          nomFitxer && 'bg-muted/30 border-solid border-primary/30'
        )}
      >
        {nomFitxer ? (
          <>
            <FileImage className="size-6 text-primary shrink-0" />
            <span className="text-xs font-medium text-foreground text-center break-all max-w-full">
              {nomFitxer}
            </span>
            <span
              role="button"
              onClick={(e) => {
                e.preventDefault()
                setNomFitxer(null)
                const input = document.getElementById(id) as HTMLInputElement
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
            <Upload className="size-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground text-center">
              Clica per seleccionar o arrossega aquí
              <br />
              {hint}
            </span>
          </>
        )}
      </label>
      <input
        id={id}
        name={name}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => setNomFitxer(e.target.files?.[0]?.name ?? null)}
      />
      {errors && errors.length > 0 && (
        <p className="text-xs text-destructive mt-1">{errors[0]}</p>
      )}
    </div>
  )
}
