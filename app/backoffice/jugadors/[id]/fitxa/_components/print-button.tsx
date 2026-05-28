'use client'

import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

export function PrintButton() {
  return (
    <Button
      variant="default"
      size="sm"
      className="gap-1.5"
      onClick={() => window.print()}
    >
      <Printer className="size-4" />
      Imprimir / PDF
    </Button>
  )
}
