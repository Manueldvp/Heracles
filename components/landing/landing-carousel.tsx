'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type CarouselItem = {
  name: string
  role: string
  description: string
  image: string
}

type Props = {
  items: CarouselItem[]
  previousLabel: string
  nextLabel: string
}

export default function LandingCarousel({ items, previousLabel, nextLabel }: Props) {
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
      <div className="overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950/80">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {items.map((item) => (
            <div key={`${item.name}-${item.role}`} className="min-w-full">
              <Card className="border-0 bg-transparent shadow-none">
                <CardContent className="grid gap-0 p-0 md:grid-cols-[1.1fr_0.9fr]">
                  <div className="relative min-h-[320px] bg-zinc-900">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  </div>
                  <div className="flex flex-col justify-between p-6 sm:p-8">
                    <div>
                      <p className="text-sm font-medium text-orange-200">{item.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">{item.role}</p>
                      <p className="mt-6 text-base leading-7 text-zinc-300">{item.description}</p>
                    </div>
                    <div className="mt-10 flex gap-2">
                      {items.map((_, index) => (
                        <span
                          key={index}
                          className={`h-1.5 rounded-full transition-all ${index === current ? 'w-10 bg-orange-500' : 'w-4 bg-zinc-700'}`}
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

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          className="border-zinc-800 bg-zinc-950 text-zinc-200 hover:bg-zinc-900"
          onClick={() => setCurrent((value) => (value - 1 + items.length) % items.length)}
        >
          {previousLabel}
        </Button>
        <Button
          type="button"
          className="bg-orange-500 text-white hover:bg-orange-600"
          onClick={() => setCurrent((value) => (value + 1) % items.length)}
        >
          {nextLabel}
        </Button>
      </div>
    </div>
  )
}
