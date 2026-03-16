'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Legend
} from 'recharts'

interface Checkin {
  created_at: string
  weight?: number
  energy_level?: number
  sleep_quality?: number
  mood?: number
  stress_level?: number
  water_liters?: number
  calories_consumed?: number
  nutrition_adherence?: number
  completed_workouts?: number
}

interface Props {
  data: Checkin[]
  allData: Checkin[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  )
}

export default function Charts({ data, allData }: Props) {
  const weightData = data.map(c => ({
    date: new Date(c.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }),
    peso: c.weight,
  }))

  const wellnessData = allData.map(c => ({
    date: new Date(c.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }),
    energia: c.energy_level,
    sueño: c.sleep_quality,
    mood: c.mood,
    estres: c.stress_level,
  }))

  const nutritionData = allData.filter(c => c.water_liters || c.calories_consumed || c.nutrition_adherence).map(c => ({
    date: new Date(c.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }),
    agua: c.water_liters,
    adherencia: c.nutrition_adherence,
    calorias: c.calories_consumed,
  }))

  const avgWeight = data.reduce((s, c) => s + (c.weight ?? 0), 0) / data.length

  return (
    <div className="flex flex-col gap-8">

      {/* Peso */}
      {data.length >= 2 && (
        <div>
          <p className="text-zinc-400 text-xs font-medium mb-3 uppercase tracking-wider">Peso (kg)</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} />
              <YAxis tick={{ fill: '#71717a', fontSize: 10 }} domain={['auto', 'auto']} tickFormatter={v => `${v}kg`} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={avgWeight} stroke="#3f3f46" strokeDasharray="4 4"
                label={{ value: 'Prom.', fill: '#52525b', fontSize: 10 }} />
              <Line type="monotone" dataKey="peso" stroke="#f97316" strokeWidth={2}
                dot={{ fill: '#f97316', r: 4 }} activeDot={{ r: 6 }} name="Peso" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Energía, Sueño, Mood */}
      {wellnessData.length >= 2 && (
        <div>
          <p className="text-zinc-400 text-xs font-medium mb-3 uppercase tracking-wider">Bienestar (1–5)</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={wellnessData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} />
              <YAxis tick={{ fill: '#71717a', fontSize: 10 }} domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#71717a' }} />
              <Line type="monotone" dataKey="energia" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} name="Energía" />
              <Line type="monotone" dataKey="sueño" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Sueño" />
              {wellnessData.some(d => d.mood) && (
                <Line type="monotone" dataKey="mood" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} name="Mood" />
              )}
              {wellnessData.some(d => d.estres) && (
                <Line type="monotone" dataKey="estres" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Estrés" strokeDasharray="4 4" />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Nutrición */}
      {nutritionData.length >= 2 && (
        <div>
          <p className="text-zinc-400 text-xs font-medium mb-3 uppercase tracking-wider">Nutrición</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={nutritionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} />
              <YAxis tick={{ fill: '#71717a', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#71717a' }} />
              {nutritionData.some(d => d.adherencia) && (
                <Bar dataKey="adherencia" fill="#22c55e" name="Adherencia %" radius={[4, 4, 0, 0]} />
              )}
              {nutritionData.some(d => d.agua) && (
                <Bar dataKey="agua" fill="#3b82f6" name="Agua (L)" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}