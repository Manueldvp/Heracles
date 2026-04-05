'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { BarChart3, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type RoutineItem = {
  id: string
  client_id: string
  created_at?: string
  title: string
  clientName: string
  activityLabel: string
}

const PAGE_SIZE = 3

export default function RecentRoutinesCard({ routines }: { routines: RoutineItem[] }) {
  const [page, setPage] = useState(0)
  const maxPage = Math.max(0, Math.ceil(routines.length / PAGE_SIZE) - 1)

  const visibleRoutines = useMemo(() => {
    const start = page * PAGE_SIZE
    return routines.slice(start, start + PAGE_SIZE)
  }, [page, routines])

  return (
    <Card className="rounded-xl border border-border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-foreground">Rutinas recientes</CardTitle>
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex min-h-[324px] flex-col justify-between gap-4">
        <div className="space-y-3">
          {visibleRoutines.map((routine) => (
            <Link
              key={routine.id}
              href={`/dashboard/clients/${routine.client_id}`}
              className="block rounded-xl border border-border bg-muted/30 p-4 transition hover:border-primary/20"
            >
              <p className="text-base font-semibold text-foreground">{routine.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{routine.clientName}</p>
              <p className="mt-2 text-xs text-muted-foreground">{routine.activityLabel}</p>
            </Link>
          ))}
          {visibleRoutines.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
              Aún no hay rutinas recientes.
            </div>
          ) : null}
        </div>

        {routines.length > PAGE_SIZE ? (
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-muted-foreground">
              {page + 1} de {maxPage + 1}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-full"
                disabled={page === 0}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Anteriores
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-full"
                disabled={page >= maxPage}
                onClick={() => setPage((current) => Math.min(maxPage, current + 1))}
              >
                Siguientes
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="h-9" />
        )}
      </CardContent>
    </Card>
  )
}
