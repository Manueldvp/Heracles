'use client'

import { useMemo, useState } from 'react'
import { Droplets, Flame, HeartPulse, MoonStar, ShieldAlert, SmilePlus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

interface Checkin {
  id: string
  created_at: string
  weight?: number
  energy_level?: number
  sleep_quality?: number
  completed_workouts?: number
  mood?: number
  stress_level?: number
  water_liters?: number
  calories_consumed?: number
  nutrition_adherence?: number
  pain_zones?: string[]
  photo_url?: string
  notes?: string
  type?: string
}

const typeLabel: Record<string, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
}

function formatCheckinDate(date: string) {
  return new Date(date).toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function MetricTile({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon: typeof Droplets
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 px-3 py-3 text-center">
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <p className="text-[11px] uppercase tracking-[0.18em]">{label}</p>
      </div>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}

function CheckinDetail({
  checkin,
  onOpenPhoto,
}: {
  checkin: Checkin
  onOpenPhoto: (url: string) => void
}) {
  return (
    <div className="mt-3 space-y-4 border-t border-border pt-4">
      <div className="grid gap-2 sm:grid-cols-4">
        <MetricTile icon={HeartPulse} label="Energía" value={checkin.energy_level ? `${checkin.energy_level}/5` : '—'} />
        <MetricTile icon={MoonStar} label="Sueño" value={checkin.sleep_quality ? `${checkin.sleep_quality}/5` : '—'} />
        <MetricTile icon={Flame} label="Entrenos" value={checkin.completed_workouts ?? '—'} />
        <MetricTile icon={SmilePlus} label="Peso" value={checkin.weight ? `${checkin.weight} kg` : '—'} />
      </div>

      {(checkin.mood || checkin.stress_level || checkin.water_liters || checkin.nutrition_adherence) && (
        <div className="flex flex-wrap gap-2">
          {checkin.mood ? <Badge className="border-border bg-muted/40 text-foreground">Mood {checkin.mood}/5</Badge> : null}
          {checkin.stress_level ? <Badge className="border-red-500/20 bg-red-500/10 text-red-400">Estrés {checkin.stress_level}/5</Badge> : null}
          {checkin.water_liters ? <Badge className="border-border bg-muted/40 text-foreground">{checkin.water_liters}L agua</Badge> : null}
          {checkin.nutrition_adherence ? <Badge className="border-primary/20 bg-primary/10 text-primary">Adherencia {checkin.nutrition_adherence}/5</Badge> : null}
          {checkin.calories_consumed ? <Badge className="border-border bg-muted/40 text-foreground">{checkin.calories_consumed} kcal</Badge> : null}
        </div>
      )}

      {checkin.pain_zones && checkin.pain_zones.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {checkin.pain_zones.map(zone => (
            <Badge key={zone} className="border-red-500/20 bg-red-500/10 text-red-300 capitalize">
              <ShieldAlert className="mr-1 h-3 w-3" />
              {zone}
            </Badge>
          ))}
        </div>
      ) : null}

      {checkin.photo_url ? (
        <button
          type="button"
          onClick={() => onOpenPhoto(checkin.photo_url!)}
          className="block w-full overflow-hidden rounded-xl border border-border"
        >
          <img src={checkin.photo_url} alt="Foto check-in" className="max-h-72 w-full object-cover" />
        </button>
      ) : null}

      {checkin.notes ? (
        <p className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          {checkin.notes}
        </p>
      ) : null}
    </div>
  )
}

export default function CheckinHistory({ checkins }: { checkins: Checkin[] }) {
  const [openId, setOpenId] = useState<string | null>(checkins[0]?.id ?? null)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  const latest = checkins[0]
  const rest = useMemo(() => checkins.slice(1), [checkins])
  const activeCheckin = rest.find(checkin => checkin.id === openId) ?? null

  return (
    <>
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">Historial de check-ins</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {latest ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{formatCheckinDate(latest.created_at)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Último registro</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  {latest.type ? (
                    <Badge className="border-border bg-muted/40 text-foreground">
                      {typeLabel[latest.type] ?? latest.type}
                    </Badge>
                  ) : null}
                  {latest.weight ? (
                    <Badge className="border-primary/20 bg-primary/10 text-primary">
                      {latest.weight} kg
                    </Badge>
                  ) : null}
                </div>
              </div>
              <CheckinDetail checkin={latest} onOpenPhoto={setSelectedPhoto} />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
              <p className="text-sm text-muted-foreground">Todavía no hay check-ins registrados.</p>
            </div>
          )}

          {rest.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Registros anteriores</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {rest.map(checkin => (
                  <button
                    key={checkin.id}
                    type="button"
                    onClick={() => setOpenId(current => current === checkin.id ? null : checkin.id)}
                    className={`min-w-[132px] rounded-xl border px-3 py-3 text-left transition ${
                      openId === checkin.id
                        ? 'border-primary/20 bg-primary/10'
                        : 'border-border bg-background hover:border-primary/20 hover:bg-muted/30'
                    }`}
                  >
                    <p className="text-sm font-medium text-foreground">
                      {new Date(checkin.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">Energía {checkin.energy_level ?? '—'}/5</p>
                    <p className="mt-1 text-xs text-muted-foreground">Sueño {checkin.sleep_quality ?? '—'}/5</p>
                    {checkin.weight ? <p className="mt-1 text-xs text-muted-foreground">{checkin.weight} kg</p> : null}
                  </button>
                ))}
              </div>

              {activeCheckin ? (
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">{formatCheckinDate(activeCheckin.created_at)}</p>
                    {activeCheckin.type ? (
                      <Badge className="border-border bg-background text-foreground">
                        {typeLabel[activeCheckin.type] ?? activeCheckin.type}
                      </Badge>
                    ) : null}
                  </div>
                  <CheckinDetail checkin={activeCheckin} onOpenPhoto={setSelectedPhoto} />
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedPhoto)} onOpenChange={open => !open && setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl border-border bg-card p-2">
          <DialogTitle className="sr-only">Vista completa de la imagen</DialogTitle>
          {selectedPhoto ? (
            <img src={selectedPhoto} alt="Foto check-in ampliada" className="max-h-[85vh] w-full rounded-xl object-contain" />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
