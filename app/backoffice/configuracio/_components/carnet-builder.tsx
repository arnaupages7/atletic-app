'use client'

import { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, Plus, Trash2, Type, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { desarCarnetLayoutAction } from '../actions'

// ── Tipus ─────────────────────────────────────────────────────────────────────

export type CarnetElement = {
  id: string
  type: 'field' | 'text'
  variable?: string
  content?: string
  x: number        // % respecte l'amplada del canvas
  y: number        // % respecte l'alçada del canvas
  fontSize: number // px
  color: string    // hex
  bold: boolean
  opacity: number  // 0.3 – 1
}

// ── Camp disponibles ──────────────────────────────────────────────────────────

const AVAILABLE_FIELDS = [
  { variable: 'nom_complet', label: 'Nom complet' },
  { variable: 'nom', label: 'Nom' },
  { variable: 'cognom1', label: 'Primer cognom' },
  { variable: 'numero_membre', label: 'Núm. soci (#0001)' },
  { variable: 'data_alta', label: 'Data d\'alta' },
  { variable: 'temporada', label: 'Temporada' },
  { variable: 'estat', label: 'Estat' },
]

// Valors de previsualització
const PREVIEW_VALUES: Record<string, string> = {
  nom_complet: 'Joan Garcia Puig',
  nom: 'Joan',
  cognom1: 'Garcia',
  numero_membre: '#0042',
  data_alta: 'Soci des de: juny 2024',
  temporada: '2025-26',
  estat: 'Actiu',
}

function resolvePreview(el: CarnetElement) {
  if (el.type === 'text') return el.content ?? 'Text'
  return PREVIEW_VALUES[el.variable ?? ''] ?? `{{${el.variable}}}`
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

// ── Canvas Carnet ─────────────────────────────────────────────────────────────

const CANVAS_W = 340
const CANVAS_H = 213

// ── Component principal ───────────────────────────────────────────────────────

export function CarnetBuilder({
  initialElements,
  fonsUrl,
}: {
  initialElements: CarnetElement[]
  fonsUrl?: string | null
}) {
  const [elements, setElements] = useState<CarnetElement[]>(initialElements)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [newText, setNewText] = useState('')

  const canvasRef = useRef<HTMLDivElement>(null)
  const draggingId = useRef<string | null>(null)
  const dragOrigin = useRef({ mx: 0, my: 0, ex: 0, ey: 0 })

  const selected = elements.find((e) => e.id === selectedId) ?? null

  // ── Drag ──────────────────────────────────────────────────────────────────

  const handleElementPointerDown = useCallback(
    (e: React.PointerEvent, el: CarnetElement) => {
      e.preventDefault()
      e.stopPropagation()
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      draggingId.current = el.id
      setSelectedId(el.id)
      dragOrigin.current = { mx: e.clientX, my: e.clientY, ex: el.x, ey: el.y }
    },
    []
  )

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingId.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const dx = ((e.clientX - dragOrigin.current.mx) / rect.width) * 100
    const dy = ((e.clientY - dragOrigin.current.my) / rect.height) * 100
    setElements((prev) =>
      prev.map((el) =>
        el.id === draggingId.current
          ? {
              ...el,
              x: Math.max(0, Math.min(95, dragOrigin.current.ex + dx)),
              y: Math.max(0, Math.min(90, dragOrigin.current.ey + dy)),
            }
          : el
      )
    )
  }, [])

  const handlePointerUp = useCallback(() => {
    draggingId.current = null
  }, [])

  // ── Afegir element ────────────────────────────────────────────────────────

  const addField = (variable: string, label: string) => {
    const id = uid()
    const el: CarnetElement = {
      id,
      type: 'field',
      variable,
      x: 5,
      y: 40,
      fontSize: 16,
      color: '#ffffff',
      bold: false,
      opacity: 1,
    }
    setElements((prev) => [...prev, el])
    setSelectedId(id)
  }

  const addText = () => {
    if (!newText.trim()) return
    const id = uid()
    const el: CarnetElement = {
      id,
      type: 'text',
      content: newText.trim(),
      x: 5,
      y: 55,
      fontSize: 12,
      color: '#ffffff',
      bold: false,
      opacity: 0.8,
    }
    setElements((prev) => [...prev, el])
    setSelectedId(id)
    setNewText('')
  }

  // ── Actualitzar propietat ─────────────────────────────────────────────────

  const updateProp = <K extends keyof CarnetElement>(key: K, value: CarnetElement[K]) => {
    if (!selectedId) return
    setElements((prev) =>
      prev.map((el) => (el.id === selectedId ? { ...el, [key]: value } : el))
    )
  }

  // ── Eliminar element ──────────────────────────────────────────────────────

  const deleteSelected = () => {
    if (!selectedId) return
    setElements((prev) => prev.filter((el) => el.id !== selectedId))
    setSelectedId(null)
  }

  // ── Desar ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true)
    setSavedOk(false)
    const result = await desarCarnetLayoutAction(elements)
    setSaving(false)
    if (!result?.error) {
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 2500)
    }
  }

  // ── Fons del canvas ───────────────────────────────────────────────────────

  const backgroundStyle: React.CSSProperties = fonsUrl
    ? { backgroundImage: `url(${fonsUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(135deg, #ff6600 0%, #cc4400 100%)' }

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Palette ──────────────────────────────────────────────────── */}
        <div className="lg:w-52 shrink-0 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Camps dinàmics
          </p>
          <div className="space-y-1">
            {AVAILABLE_FIELDS.map((f) => (
              <button
                key={f.variable}
                type="button"
                onClick={() => addField(f.variable, f.label)}
                className="w-full flex items-center gap-2 text-left px-2.5 py-1.5 rounded-md text-xs hover:bg-muted transition-colors border border-transparent hover:border-border"
              >
                <Hash className="size-3 text-muted-foreground shrink-0" />
                {f.label}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Text lliure
            </p>
            <Input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Escriu text…"
              className="h-7 text-xs"
              onKeyDown={(e) => { if (e.key === 'Enter') addText() }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-xs h-7"
              onClick={addText}
              disabled={!newText.trim()}
            >
              <Type className="size-3" />
              Afegir text
            </Button>
          </div>
        </div>

        {/* ── Canvas + propietats ───────────────────────────────────────── */}
        <div className="flex-1 space-y-4 min-w-0">
          {/* Canvas */}
          <div
            ref={canvasRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onClick={() => setSelectedId(null)}
            style={{
              ...backgroundStyle,
              width: `${CANVAS_W}px`,
              height: `${CANVAS_H}px`,
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
              cursor: 'default',
              userSelect: 'none',
            }}
          >
            {/* Decoració fixa */}
            <div style={{ position: 'absolute', right: '-30px', bottom: '-30px', width: '190px', height: '190px', borderRadius: '50%', background: 'rgba(0,0,0,0.15)' }} />
            <div style={{ position: 'absolute', right: '30px', bottom: '20px', width: '130px', height: '130px', borderRadius: '50%', background: 'rgba(0,0,0,0.1)' }} />
            <div style={{ position: 'absolute', top: '-50px', left: '120px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

            {/* Logo + nom club (no configurable) */}
            <div style={{ position: 'absolute', top: '10px', left: '12px', display: 'flex', alignItems: 'center', gap: '6px', zIndex: 1 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="" width={22} height={22} />
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '8px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                Atlètic Club Banyoles
              </span>
            </div>

            {/* Elements configurables */}
            {elements.map((el) => (
              <div
                key={el.id}
                onPointerDown={(e) => handleElementPointerDown(e, el)}
                onClick={(e) => { e.stopPropagation(); setSelectedId(el.id) }}
                style={{
                  position: 'absolute',
                  left: `${el.x}%`,
                  top: `${el.y}%`,
                  fontSize: `${el.fontSize}px`,
                  color: el.color,
                  fontWeight: el.bold ? 800 : 400,
                  opacity: el.opacity,
                  whiteSpace: 'nowrap',
                  cursor: 'grab',
                  zIndex: 2,
                  padding: '2px 4px',
                  borderRadius: '3px',
                  outline: selectedId === el.id ? '1.5px dashed rgba(255,255,255,0.8)' : 'none',
                  outlineOffset: '2px',
                  touchAction: 'none',
                }}
              >
                {resolvePreview(el)}
              </div>
            ))}

            {elements.length === 0 && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
                  Afegeix camps des de la paleta
                </span>
              </div>
            )}
          </div>

          {/* Propietats element seleccionat */}
          {selected && (
            <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {selected.type === 'field'
                    ? AVAILABLE_FIELDS.find((f) => f.variable === selected.variable)?.label ?? selected.variable
                    : `"${selected.content}"`}
                </p>
                <button
                  type="button"
                  onClick={deleteSelected}
                  className="text-destructive hover:text-destructive/80 transition-colors"
                  aria-label="Eliminar element"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Mida */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Mida ({selected.fontSize}px)</Label>
                  <input
                    type="range" min={8} max={36} step={1}
                    value={selected.fontSize}
                    onChange={(e) => updateProp('fontSize', Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>

                {/* Opacitat */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Opacitat ({Math.round(selected.opacity * 100)}%)</Label>
                  <input
                    type="range" min={0.2} max={1} step={0.05}
                    value={selected.opacity}
                    onChange={(e) => updateProp('opacity', Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>

                {/* Color */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selected.color}
                      onChange={(e) => updateProp('color', e.target.value)}
                      className="size-7 rounded cursor-pointer border border-border"
                    />
                    <Input
                      value={selected.color}
                      onChange={(e) => updateProp('color', e.target.value)}
                      className="h-7 text-xs font-mono"
                      maxLength={7}
                    />
                  </div>
                </div>

                {/* Negreta */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Estil</Label>
                  <button
                    type="button"
                    onClick={() => updateProp('bold', !selected.bold)}
                    className={cn(
                      'px-3 py-1 rounded text-xs font-bold border transition-colors',
                      selected.bold
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-background border-border hover:bg-muted'
                    )}
                  >
                    Negreta
                  </button>
                </div>

                {/* Text lliure: editar contingut */}
                {selected.type === 'text' && (
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs">Contingut</Label>
                    <Input
                      value={selected.content ?? ''}
                      onChange={(e) => updateProp('content', e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botons d'acció */}
      <div className="flex items-center gap-3 pt-2 border-t">
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="gap-1.5"
          size="sm"
        >
          <Save className="size-3.5" />
          {saving ? 'Desant…' : 'Desar layout'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => { setElements([]); setSelectedId(null) }}
          disabled={saving}
        >
          Reiniciar
        </Button>
        {savedOk && (
          <span className="text-xs text-green-600 font-medium">Layout desat ✓</span>
        )}
      </div>

      {elements.length > 0 && (
        <p className="text-xs text-muted-foreground">
          <Plus className="size-3 inline mr-0.5" />
          Clica un camp per seleccionar-lo · Arrossega per reposicionar-lo
        </p>
      )}
    </div>
  )
}
