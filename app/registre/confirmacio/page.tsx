import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, Mail } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Registre completat' }

export default function RegistreConfirmacioPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icona */}
        <div className="flex justify-center">
          <div className="size-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 className="size-10 text-green-600 dark:text-green-400" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Registre completat!</h1>
          <p className="text-muted-foreground">
            El teu compte s&apos;ha creat correctament. T&apos;hem enviat un correu de benvinguda amb les
            instruccions per accedir al portal.
          </p>
        </div>

        {/* Avís quota */}
        <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950/30 text-left">
          <Mail className="size-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Pendent de pagament
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              Per activar el teu compte de soci, cal abonar la quota anual de 25€. Podràs fer-ho
              des del portal un cop t&apos;hagis identificat.
            </p>
          </div>
        </div>

        {/* Botó */}
        <Link
          href="/login"
          className={cn(buttonVariants({ size: 'lg' }), 'w-full')}
        >
          Accedir al portal
        </Link>
      </div>
    </div>
  )
}
