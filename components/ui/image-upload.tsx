'use client'

import { useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { uploadFitxerAction } from '@/lib/upload'

interface Props {
  value?: string | null
  onUrlChange: (url: string | null) => void
  carpeta?: string
  className?: string
}

export function ImageUpload({ value, onUrlChange, carpeta = 'general', className }: Props) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = useCallback(
    async (file: File) => {
      setError(null)
      setLoading(true)
      const fd = new FormData()
      fd.append('file', file)
      fd.append('carpeta', carpeta)
      const result = await uploadFitxerAction(fd)
      setLoading(false)
      if (result.error) {
        setError(result.error)
      } else if (result.url) {
        onUrlChange(result.url)
      }
    },
    [carpeta, onUrlChange]
  )

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    upload(files[0])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = () => setDragging(false)

  return (
    <div className={cn('space-y-2', className)}>
      {/* Preview */}
      {value && (
        <div className="relative w-full max-w-sm h-36 rounded-lg overflow-hidden border bg-muted group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onUrlChange(null)}
            className="absolute top-1.5 right-1.5 size-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors',
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
        )}
      >
        {loading ? (
          <>
            <Loader2 className="size-6 text-muted-foreground animate-spin" />
            <p className="text-xs text-muted-foreground">Pujant…</p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Upload className="size-5 text-muted-foreground" />
              <ImageIcon className="size-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Arrossega una imatge aquí o{' '}
              <span className="text-primary font-medium">fes clic per seleccionar</span>
            </p>
            <p className="text-[11px] text-muted-foreground/60">PNG, JPG, WebP — màx. 10 MB</p>
          </>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
