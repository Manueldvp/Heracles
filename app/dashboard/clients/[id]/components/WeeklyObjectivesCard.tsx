'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Target, Trash2 } from 'lucide-react'
import {
  buildWeeklyObjectiveMetrics,
  getWeekRange,
  getWeekStartIso,
  getWeeklyObjectiveLabel,
  getWeeklyObjectiveProgress,
  weeklyObjectiveMetricOptions,
  type WeeklyObjective,
  type WeeklyObjectiveMetric,
} from '@/lib/weekly-objectives'

type WeeklyCheckin = {
  created_at: string
  type?: string | null
  weight?: number | null
}

type WeeklySession = {
  date: string
}

const DEFAULT_METRIC = weeklyObjectiveMetricOptions[0].value

export default function WeeklyObjectivesCard({ clientId }: { clientId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [objectives, setObjectives] = useState<WeeklyObjective[]>([])
  const [sessions, setSessions] = useState<WeeklySession[]>([])
  const [checkins, setCheckins] = useState<WeeklyCheckin[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [metric, setMetric] = useState<WeeklyObjectiveMetric>(DEFAULT_METRIC)
  const [targetValue, setTargetValue] = useState(weeklyObjectiveMetricOptions[0].defaultTarget)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const weekStart = getWeekStartIso()
      const range = getWeekRange()

      const [{ data: objectiveRows }, { data: sessionRows }, { data: checkinRows }] = await Promise.all([
        supabase
          .from('weekly_client_objectives')
          .select('*')
          .eq('client_id', clientId)
          .eq('week_start', weekStart)
          .order('created_at', { ascending: false }),
        supabase
          .from('workout_sessions')
          .select('date')
          .eq('client_id', clientId)
          .gte('date', weekStart)
          .lt('date', range.end.toISOString().split('T')[0]),
        supabase
          .from('checkins')
          .select('created_at, type, weight')
          .eq('client_id', clientId)
          .gte('created_at', range.startIso)
          .lt('created_at', range.endIso),
      ])

      setObjectives((objectiveRows as WeeklyObjective[] | null) ?? [])
      setSessions(sessionRows ?? [])
      setCheckins(checkinRows ?? [])
      setLoading(false)
    }

    void load()
  }, [clientId, supabase])

  const metrics = buildWeeklyObjectiveMetrics({ sessions, checkins })

  const handleMetricChange = (value: WeeklyObjectiveMetric) => {
    setMetric(value)
    const preset = weeklyObjectiveMetricOptions.find((option) => option.value === value)
    if (preset) {
      setTargetValue(preset.defaultTarget)
    }
  }

  const handleCreate = async () => {
    if (!title.trim()) return
    setSaving(true)

    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user

    if (!user) {
      setSaving(false)
      return
    }

    const { data } = await supabase
      .from('weekly_client_objectives')
      .insert({
        client_id: clientId,
        trainer_id: user.id,
        week_start: getWeekStartIso(),
        title: title.trim(),
        metric,
        target_value: targetValue,
      })
      .select('*')
      .single()

    if (data) {
      setObjectives((current) => [data as WeeklyObjective, ...current])
      setTitle('')
      handleMetricChange(DEFAULT_METRIC)
    }

    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('weekly_client_objectives').delete().eq('id', id)
    setObjectives((current) => current.filter((objective) => objective.id !== id))
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
          <Target size={14} className="text-emerald-400" />
          Objetivos semanales
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_120px_auto]">
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs uppercase tracking-widest">Título</Label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ej: Completar 3 entrenamientos"
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs uppercase tracking-widest">Métrica</Label>
            <select
              value={metric}
              onChange={(event) => handleMetricChange(event.target.value as WeeklyObjectiveMetric)}
              className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-white"
            >
              {weeklyObjectiveMetricOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs uppercase tracking-widest">Meta</Label>
            <Input
              type="number"
              min={1}
              value={targetValue}
              onChange={(event) => setTargetValue(Math.max(1, parseInt(event.target.value || '1', 10)))}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => void handleCreate()}
              disabled={saving || !title.trim()}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 size={18} className="animate-spin text-zinc-500" />
          </div>
        ) : objectives.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-700 px-4 py-6 text-center">
            <p className="text-sm text-zinc-400">Aún no hay objetivos para esta semana.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {objectives.map((objective) => {
              const progress = getWeeklyObjectiveProgress(objective.metric, metrics)
              const completed = progress >= objective.target_value

              return (
                <div key={objective.id} className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-white">{objective.title}</p>
                        <Badge className={completed ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-zinc-800 text-zinc-300 border-zinc-700'}>
                          {progress}/{objective.target_value}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">{getWeeklyObjectiveLabel(objective.metric)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDelete(objective.id)}
                      className="shrink-0 text-zinc-500 transition hover:text-red-400"
                      aria-label="Eliminar objetivo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
