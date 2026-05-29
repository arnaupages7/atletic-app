import type { Metadata } from 'next'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Plus, Lock, Globe, Eye, EyeOff, Pencil, PlayCircle } from 'lucide-react'

export const metadata: Metadata = { title: 'Vídeos' }

function getYouTubeThumbnail(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?#]+)/,
  ]
  for (const pattern of patterns) {
    const m = url.match(pattern)
    if (m) return `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg`
  }
  return null
}

export default async function BackofficeVideosPage() {
  const supabase = await createServiceClient()

  const { data: videos } = await supabase
    .from('videos')
    .select('id, titol, descripcio, url_youtube, exclusiu_socis, publicat, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vídeos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {videos?.length ?? 0} vídeo{videos?.length !== 1 ? 's' : ''} en total
          </p>
        </div>
        <Link
          href="/backoffice/videos/nou"
          className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'gap-1.5')}
        >
          <Plus className="size-4" />
          Nou vídeo
        </Link>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell w-16">Thumb</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Títol</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Visibilitat</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estat</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(!videos || videos.length === 0) ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No hi ha vídeos. Afegeix el primer!
                  </td>
                </tr>
              ) : (
                videos.map((v) => {
                  const thumb = getYouTubeThumbnail(v.url_youtube)
                  return (
                    <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt={v.titol}
                            className="w-16 h-10 object-cover rounded border"
                          />
                        ) : (
                          <div className="w-16 h-10 rounded border bg-muted flex items-center justify-center">
                            <PlayCircle className="size-4 text-muted-foreground" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        <div>{v.titol}</div>
                        {v.descripcio && (
                          <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {v.descripcio}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {v.exclusiu_socis ? (
                          <span className="flex items-center gap-1 text-xs text-amber-700">
                            <Lock className="size-3" /> Socis
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Globe className="size-3" /> Públic
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {v.publicat ? (
                          <span className="flex items-center gap-1 text-xs text-green-700">
                            <Eye className="size-3" /> Publicat
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <EyeOff className="size-3" /> Esborrany
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/backoffice/videos/${v.id}/editar`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline underline-offset-4"
                        >
                          <Pencil className="size-3" />
                          Editar
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
