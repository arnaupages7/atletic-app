'use client'

import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const MESOS = [
  'Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny',
  'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre',
]

interface DateSelectProps {
  name: string
  defaultValue?: string   // ISO: YYYY-MM-DD
  maxYear?: number        // any màxim seleccionable (defecte: any actual)
  minYear?: number        // any mínim seleccionable (defecte: actual - 100)
  invalid?: boolean
}

export function DateSelect({
  name,
  defaultValue,
  maxYear,
  minYear,
  invalid,
}: DateSelectProps) {
  const parts = defaultValue?.split('-') ?? []
  const [year, setYear] = useState(parts[0] ?? '')
  const [month, setMonth] = useState(parts[1] ?? '')
  const [day, setDay] = useState(parts[2] ?? '')

  const currentYear = new Date().getFullYear()
  const yMax = maxYear ?? currentYear
  const yMin = minYear ?? currentYear - 100

  const years = Array.from({ length: yMax - yMin + 1 }, (_, i) => yMax - i)

  // Dies vàlids per al mes/any seleccionats
  const daysInMonth = year && month
    ? new Date(parseInt(year), parseInt(month), 0).getDate()
    : 31
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const isoValue = year && month && day ? `${year}-${month}-${day}` : ''

  function handleMonthChange(val: string | null) {
    const m = val ?? ''
    setMonth(m)
    if (day && year && m) {
      const maxDay = new Date(parseInt(year), parseInt(m), 0).getDate()
      if (parseInt(day) > maxDay) setDay('')
    }
  }

  function handleYearChange(val: string | null) {
    const y = val ?? ''
    setYear(y)
    if (day && month && y) {
      const maxDay = new Date(parseInt(y), parseInt(month), 0).getDate()
      if (parseInt(day) > maxDay) setDay('')
    }
  }

  return (
    <div className="flex gap-2">
      {/* Input ocult amb el valor ISO que llegeix el servidor */}
      <input type="hidden" name={name} value={isoValue} />

      {/* Dia */}
      <Select value={day} onValueChange={(v) => setDay(v ?? '')}>
        <SelectTrigger
          className="w-[72px]"
          aria-label="Dia"
          aria-invalid={invalid}
          data-invalid={invalid || undefined}
        >
          <SelectValue placeholder="Dia" />
        </SelectTrigger>
        <SelectContent>
          {days.map((d) => (
            <SelectItem key={d} value={String(d).padStart(2, '0')}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Mes */}
      <Select value={month} onValueChange={handleMonthChange}>
        <SelectTrigger
          className="flex-1"
          aria-label="Mes"
          aria-invalid={invalid}
          data-invalid={invalid || undefined}
        >
          <SelectValue placeholder="Mes" />
        </SelectTrigger>
        <SelectContent>
          {MESOS.map((m, i) => (
            <SelectItem key={i + 1} value={String(i + 1).padStart(2, '0')}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Any */}
      <Select value={year} onValueChange={handleYearChange}>
        <SelectTrigger
          className="w-[90px]"
          aria-label="Any"
          aria-invalid={invalid}
          data-invalid={invalid || undefined}
        >
          <SelectValue placeholder="Any" />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
