type Props = {
  description?: string | null
  instructions?: string[] | string | null
  notes?: string | null
  compact?: boolean
}

function normalizeInstructions(instructions?: string[] | string | null) {
  if (Array.isArray(instructions)) {
    return instructions.map((item) => item?.trim()).filter((item): item is string => Boolean(item))
  }

  if (typeof instructions === 'string') {
    return instructions
      .split(/\n|•|\. (?=[A-ZÁÉÍÓÚÜÑ])/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

export default function ExerciseDetails({
  description,
  instructions,
  notes,
  compact = false,
}: Props) {
  const instructionItems = normalizeInstructions(instructions)

  if (!description && instructionItems.length === 0 && !notes) return null

  return (
    <div className={`space-y-3 ${compact ? 'mt-3' : 'mt-4'}`}>
      {description ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Descripción</p>
          <p className="mt-2 text-sm leading-6 text-zinc-300">{description}</p>
        </div>
      ) : null}

      {instructionItems.length > 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Instrucciones</p>
          <ul className="mt-2 space-y-2">
            {instructionItems.map((item, index) => (
              <li key={`${index}-${item.slice(0, 12)}`} className="flex gap-2 text-sm leading-6 text-zinc-300">
                <span className="mt-1 text-xs text-orange-400">{index + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {notes ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Notas del entrenador</p>
          <p className="mt-2 text-sm leading-6 text-zinc-300">{notes}</p>
        </div>
      ) : null}
    </div>
  )
}
