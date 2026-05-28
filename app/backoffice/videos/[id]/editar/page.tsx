import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronLeft } from 'lucide-react'
import { VideoForm } from '../../_components/video-form'
import { editarVideoAction, eliminarVideoAction } from './actions'
import { DeleteVideoButton } from './_components/delete-video-button'

export const metadata: Metadata = { title: 'Editar vídeo' }

export default async function EditarVideoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: video } = await supabase
    .from('videos')
    .select('id, titol, descripcio, url_youtube, exclusiu_socis, publicat')
    .eq('id', id)
    .single()

  if (!video) notFound()

  const editarAction = editarVideoAction.bind(null, id)
  const eliminarAction = eliminarVideoAction.bind(null, id)

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
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Editar vídeo</h1>
          <DeleteVideoButton action={eliminarAction} titol={video.titol} />
        </div>
      </div>

      <VideoForm
        action={editarAction}
        defaults={{
          titol: video.titol,
          descripcio: video.descripcio,
          url_youtube: video.url_youtube,
          exclusiu_socis: video.exclusiu_socis,
          publicat: video.publicat,
        }}
        submitLabel="Desar canvis"
        pendingLabel="Desant…"
      />
    </div>
  )
}
