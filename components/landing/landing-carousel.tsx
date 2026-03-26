'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'

type CarouselItem = {
  name: string
  role: string
  description: string
  image: string
}

type Props = {
  items: CarouselItem[]
}

export default function LandingCarousel({ items }: Props) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (items.length <= 1) return

    const intervalId = window.setInterval(() => {
      setCurrent((value) => (value + 1) % items.length)
    }, 5000)

    return () => window.clearInterval(intervalId)
  }, [items.length])

  if (items.length === 0) return null

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-[28px] border border-border bg-card">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {items.map((item) => (
            <div key={`${item.name}-${item.role}`} className="min-w-full">
              <Card className="border-0 bg-transparent shadow-none">
                <CardContent className="grid gap-0 p-0 md:grid-cols-[1.1fr_0.9fr]">
                  <div className="relative min-h-[320px] bg-muted">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-background/10 to-transparent" />
                  </div>
                  <div className="flex flex-col justify-between p-6 sm:p-8">
                    <div>
                      <p className="text-sm font-medium text-primary">{item.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.role}</p>
                      <p className="mt-6 text-base leading-7 text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="mt-10 flex gap-2">
                      {items.map((_, index) => (
                        <span
                          key={index}
                          className={`h-1.5 rounded-full transition-all ${index === current ? 'w-10 bg-primary' : 'w-4 bg-border'}`}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${((current + 1) / items.length) * 100}%` }}
          />
        </div>
        <div className="flex gap-2">
          {items.map((item, index) => (
            <button
              key={`${item.name}-${index}`}
              type="button"
              aria-label={item.name}
              onClick={() => setCurrent(index)}
              className={`h-2 rounded-full transition-all ${
                index === current ? 'w-8 bg-primary' : 'w-2 bg-border hover:bg-muted-foreground'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
