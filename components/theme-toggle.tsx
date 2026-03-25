'use client'

import { useSyncExternalStore } from 'react'
import { LaptopMinimal, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const options = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: LaptopMinimal },
] as const

type ThemeValue = (typeof options)[number]['value']

export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  )

  if (!mounted) {
    return (
      <div className={cn('inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm', className)}>
        {options.map((option) => (
          <div key={option.value} className="h-9 min-w-9 rounded-full bg-muted/70 px-3" />
        ))}
      </div>
    )
  }

  return (
    <div className={cn('inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm', className)}>
      {options.map((option) => {
        const Icon = option.icon
        const active = theme === option.value

        return (
          <Button
            key={option.value}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setTheme(option.value as ThemeValue)}
            className={cn(
              'rounded-full px-3 text-xs',
              active
                ? 'bg-primary text-primary-foreground hover:bg-primary-hover'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon className="size-3.5" />
            <span className="hidden sm:inline">{option.label}</span>
          </Button>
        )
      })}
    </div>
  )
}
