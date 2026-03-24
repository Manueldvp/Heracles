const GROUP_KEYWORDS: Array<{ group: string; keywords: string[] }> = [
  { group: 'Chest', keywords: ['bench', 'press', 'chest', 'pec', 'push up', 'push-up', 'fly'] },
  { group: 'Back', keywords: ['row', 'pull', 'lat', 'deadlift', 'back'] },
  { group: 'Legs', keywords: ['squat', 'lunge', 'leg', 'quad', 'hamstring', 'calf', 'glute'] },
  { group: 'Shoulders', keywords: ['shoulder', 'lateral raise', 'front raise', 'rear delt', 'overhead press'] },
  { group: 'Arms', keywords: ['curl', 'tricep', 'bicep', 'extension', 'skull crusher', 'dip'] },
  { group: 'Core', keywords: ['plank', 'crunch', 'core', 'abs', 'sit up', 'sit-up', 'russian twist'] },
]

export function inferMuscleGroup(exerciseName: string) {
  const normalized = exerciseName.toLowerCase()
  const match = GROUP_KEYWORDS.find(entry => entry.keywords.some(keyword => normalized.includes(keyword)))
  return match?.group ?? 'Full body'
}
