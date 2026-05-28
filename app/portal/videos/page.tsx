import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { VideoCard } from './_components/video-card'
import { PlayCircle } from 'lucide-react'

export const metadata: Metadata = { title: 'Vídeos' }

export default async function VideosPage() {
  const supabase = await createClient()

  const { data: videos, error } = await supabase
    .from('videos')
    .select('*')
    .eq('publicat', true)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Vídeos</h1>
        <p className="text-muted-foreground text-sm">
          No s&apos;han pogut carregar els vídeos. Torna-ho a intentar.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Vídeos exclusius</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Continguts audiovisuals exclusius per als socis de l&apos;Atlètic Club Banyoles.
        </p>
      </div>

      {(!videos || videos.length === 0) ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <PlayCircle className="size-8 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            Encara no hi ha vídeos publicats.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  )
}
