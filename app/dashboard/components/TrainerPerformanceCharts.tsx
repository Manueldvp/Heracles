'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'

type TrendPoint = {
  month: string
  retention: number
  activeClients: number
  churnedClients: number
  newClients: number
}

export default function TrainerPerformanceCharts({ data }: { data: TrendPoint[] }) {
  return (
    <Card className="rounded-xl border border-border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-foreground">Indicadores de rendimiento</CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Retención y cartera activa</p>
            <p className="text-xs text-muted-foreground">Evolución mensual de retención y clientes activos.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line yAxisId="left" type="monotone" dataKey="activeClients" stroke="#f97316" strokeWidth={2.5} name="Clientes activos" />
                <Line yAxisId="left" type="monotone" dataKey="newClients" stroke="#22c55e" strokeWidth={2.5} name="Clientes nuevos" />
                <Line yAxisId="right" type="monotone" dataKey="retention" stroke="#60a5fa" strokeWidth={2.5} name="Retención %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Bajas y vencimientos</p>
            <p className="text-xs text-muted-foreground">Clientes que se fueron o vencieron en cada mes.</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="churnedClients" fill="#ef4444" radius={[6, 6, 0, 0]} name="Clientes que se van" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
