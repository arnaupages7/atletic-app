import type { Metadata } from 'next'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronLeft } from 'lucide-react'
import { VideoForm } from '../_components/video-form'
import { crearVideoAction } from './actions'

export const metadata: Metadata = { title: 'Nou vídeo' }

export default function NouVideoPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Link
          href="/backoffice/videos"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2')}
        >
          <ChevronLeft className="size-4" />
          Vídeos
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Nou vídeo</h1>
      </div>

      <VideoForm
        action={crearVideoAction}
        submitLabel="Afegir vídeo"
        pendingLabel="Afegint…"
      />
    </div>
  )
}
