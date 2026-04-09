export type WeeklyObjectiveMetric = 'workouts' | 'daily_checkins' | 'weekly_checkin' | 'weekly_weight'

export type WeeklyObjective = {
  id: string
  client_id: string
  trainer_id: string
  week_start: string
  title: string
  metric: WeeklyObjectiveMetric
  target_value: number
  created_at?: string
  updated_at?: string
}

export type WeeklyObjectiveMetrics = {
  workoutsCompleted: number
  dailyCheckinsCompleted: number
  hasWeeklyCheckin: boolean
  hasWeeklyWeight: boolean
}

export const weeklyObjectiveMetricOptions: Array<{
  value: WeeklyObjectiveMetric
  label: string
  defaultTarget: number
}> = [
  { value: 'workouts', label: 'Entrenamientos completados', defaultTarget: 3 },
  { value: 'daily_checkins', label: 'Check-ins diarios', defaultTarget: 4 },
  { value: 'weekly_checkin', label: 'Check-in semanal', defaultTarget: 1 },
  { value: 'weekly_weight', label: 'Peso semanal registrado', defaultTarget: 1 },
]

export function getWeekStartDate(date = new Date()) {
  const value = new Date(date)
  const day = value.getDay()
  const diff = day === 0 ? -6 : 1 - day
  value.setDate(value.getDate() + diff)
  value.setHours(0, 0, 0, 0)
  return value
}

export function getWeekStartIso(date = new Date()) {
  return getWeekStartDate(date).toISOString().split('T')[0]
}

export function getWeekRange(date = new Date()) {
  const start = getWeekStartDate(date)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return {
    start,
    end,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  }
}

export function buildWeeklyObjectiveMetrics(input: {
  sessions?: Array<{ date: string }>
  checkins?: Array<{ created_at: string; type?: string | null; weight?: number | null }>
}): WeeklyObjectiveMetrics {
  const sessions = input.sessions ?? []
  const checkins = input.checkins ?? []

  return {
    workoutsCompleted: sessions.length,
    dailyCheckinsCompleted: checkins.filter((checkin) => checkin.type === 'daily').length,
    hasWeeklyCheckin: checkins.some((checkin) => checkin.type === 'weekly'),
    hasWeeklyWeight: checkins.some((checkin) => checkin.type === 'weekly' && checkin.weight != null),
  }
}

export function getWeeklyObjectiveProgress(metric: WeeklyObjectiveMetric, metrics: WeeklyObjectiveMetrics) {
  switch (metric) {
    case 'workouts':
      return metrics.workoutsCompleted
    case 'daily_checkins':
      return metrics.dailyCheckinsCompleted
    case 'weekly_checkin':
      return metrics.hasWeeklyCheckin ? 1 : 0
    case 'weekly_weight':
      return metrics.hasWeeklyWeight ? 1 : 0
    default:
      return 0
  }
}

export function getWeeklyObjectiveLabel(metric: WeeklyObjectiveMetric) {
  return weeklyObjectiveMetricOptions.find((option) => option.value === metric)?.label ?? metric
}

export function getWeeklyObjectiveProgressLabel(objective: Pick<WeeklyObjective, 'metric' | 'target_value'>, metrics: WeeklyObjectiveMetrics) {
  const progress = getWeeklyObjectiveProgress(objective.metric, metrics)
  return `${progress}/${objective.target_value}`
}
