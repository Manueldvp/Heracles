'use client'

import { useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export default function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  )

  if (!mounted) {
    return <div className={cn('size-9 rounded-full border border-border bg-card shadow-sm', className)} />
  }

  const isDark = resolvedTheme === 'dark'
  const Icon = isDark ? Sun : Moon
  const label = isDark ? 'Activar modo claro' : 'Activar modo oscuro'

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={label}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'size-9 rounded-full border-border bg-card text-muted-foreground shadow-sm hover:bg-accent hover:text-accent-foreground',
        className
      )}
    >
      <Icon className="size-4" />
    </Button>
  )
}
