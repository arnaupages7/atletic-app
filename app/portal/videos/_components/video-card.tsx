'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

type Video = {
  id: string
  titol: string
  descripcio: string | null
  url_youtube: string
  exclusiu_socis: boolean
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /[?&]v=([^&]+)/,           // youtube.com/watch?v=ID
    /youtu\.be\/([^?]+)/,       // youtu.be/ID
    /embed\/([^?]+)/,           // youtube.com/embed/ID
    /shorts\/([^?]+)/,          // youtube.com/shorts/ID
  ]
  for (const re of patterns) {
    const m = url.match(re)
    if (m) return m[1]
  }
  return null
}

export function VideoCard({ video }: { video: Video }) {
  const [showEmbed, setShowEmbed] = useState(false)
  const videoId = getYouTubeId(video.url_youtube)
  const thumbnailUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : null

  return (
    <Card className="overflow-hidden">
      {/* Thumbnail / embed area */}
      <div className="relative aspect-video bg-muted">
        {showEmbed && videoId ? (
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title={video.titol}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            onClick={() => setShowEmbed(true)}
            className="absolute inset-0 w-full h-full flex items-center justify-center group"
            aria-label={`Reproduir: ${video.titol}`}
          >
            {thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnailUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div className={cn(
              'relative z-10 flex items-center justify-center size-14 rounded-full',
              'bg-black/70 text-white transition-transform group-hover:scale-110'
            )}>
              <Play className="size-6 ml-0.5" fill="currentColor" />
            </div>
          </button>
        )}
      </div>

      {/* Info */}
      <CardHeader className="pb-1 pt-3">
        <CardTitle className="flex items-start gap-2 text-sm font-semibold leading-snug">
          <span className="flex-1">{video.titol}</span>
          {video.exclusiu_socis && (
            <Lock className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
          )}
        </CardTitle>
      </CardHeader>
      {video.descripcio && (
        <CardContent className="pt-0 pb-3">
          <p className="text-xs text-muted-foreground line-clamp-2">{video.descripcio}</p>
        </CardContent>
      )}
    </Card>
  )
}
