export type ExerciseMediaSource = {
  kind: 'image' | 'video' | 'none'
  src: string | null
  poster?: string | null
  label: string
}

type ExerciseMediaInput = {
  name?: string
  image_url?: string
  video_url?: string
  media_url?: string
  media_type?: string
}

function isVideoUrl(url?: string | null) {
  if (!url) return false
  const normalized = url.toLowerCase()
  return ['.mp4', '.webm', '.mov', '.m3u8'].some(ext => normalized.includes(ext))
}

export function resolveExerciseMedia(exercise?: ExerciseMediaInput | null): ExerciseMediaSource {
  if (!exercise) {
    return { kind: 'none', src: null, label: 'Media no disponible' }
  }

  const candidate = exercise.video_url || exercise.media_url || null
  if (candidate && (exercise.media_type === 'video' || isVideoUrl(candidate))) {
    return {
      kind: 'video',
      src: candidate,
      poster: exercise.image_url ?? null,
      label: `Video de ${exercise.name ?? 'ejercicio'}`,
    }
  }

  if (exercise.image_url) {
    return {
      kind: 'image',
      src: exercise.image_url,
      label: `Imagen de ${exercise.name ?? 'ejercicio'}`,
    }
  }

  return { kind: 'none', src: null, label: 'Media no disponible' }
}
