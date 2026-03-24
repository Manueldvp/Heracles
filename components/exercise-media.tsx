import { PlayCircle, Video, ImageIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { resolveExerciseMedia } from '@/lib/exercise-media'

type ExerciseLike = {
  name: string
  image_url?: string
  video_url?: string
  media_url?: string
  media_type?: string
}

export default function ExerciseMedia({
  exercise,
  compact = false,
  className = '',
}: {
  exercise: ExerciseLike
  compact?: boolean
  className?: string
}) {
  const media = resolveExerciseMedia(exercise)
  const sizeClass = compact ? 'aspect-[4/3]' : 'aspect-video'

  return (
    <Card className={`overflow-hidden border-zinc-800 bg-zinc-950 ${className}`}>
      <CardContent className="p-0">
        <div className={`relative ${sizeClass} bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900`}>
          {media.kind === 'video' && media.src ? (
            <video
              controls
              playsInline
              preload="metadata"
              poster={media.poster ?? undefined}
              className="h-full w-full object-cover"
            >
              <source src={media.src} />
            </video>
          ) : media.kind === 'image' && media.src ? (
            <img
              src={media.src}
              alt={media.label}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.18),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_40%)]">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900/80">
                <ImageIcon size={22} className="text-zinc-500" />
              </div>
              <p className="max-w-[220px] text-center text-xs text-zinc-500">
                Agrega imagen o video para hacer este ejercicio más claro y visual.
              </p>
            </div>
          )}

          <div className="absolute left-3 top-3 flex items-center gap-2">
            <Badge className="border-zinc-700 bg-black/65 text-zinc-200 backdrop-blur">
              {media.kind === 'video' ? <Video size={12} className="mr-1" /> : <ImageIcon size={12} className="mr-1" />}
              {media.kind === 'video' ? 'Video' : media.kind === 'image' ? 'Imagen' : 'Demo'}
            </Badge>
          </div>

          {media.kind === 'video' && (
            <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1 rounded-full border border-white/10 bg-black/50 px-2 py-1 text-[11px] text-white backdrop-blur">
              <PlayCircle size={12} />
              Reproducir
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
