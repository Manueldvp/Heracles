import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { APP_NAME, APP_TAGLINE } from '@/lib/branding'

const primaryLinks = [
  'Client management built for coaching',
  'Training, nutrition and check-ins in one system',
  'A premium experience that scales with your business',
]

const frictionPoints = [
  {
    title: 'Management Overload',
    copy: 'Spreadsheets, WhatsApp threads and manual follow-up slow down your growth. The more clients you take on, the harder it becomes to keep quality high.',
  },
  {
    title: 'Adherence Gaps',
    copy: 'When progress lives in scattered messages, you react late. Clear routines, nutrition and check-ins keep momentum visible for both coach and client.',
  },
  {
    title: 'Invisible Effort',
    copy: 'A lot of your work happens behind the scenes. Treinex turns that work into a professional product your clients can actually feel.',
  },
]

const featureBlocks = [
  {
    title: 'Client Management',
    copy: 'Invitations, onboarding, profile context and progress history connected in a single workspace.',
    tone: 'col-span-1 md:col-span-4 bg-zinc-900/90',
  },
  {
    title: 'Smart Workout Tracking',
    copy: 'Clear execution flows with timers, sets, rests and structured logging for every session.',
    tone: 'col-span-1 md:col-span-2 bg-zinc-950/90',
  },
  {
    title: 'Nutrition Planning',
    copy: 'Meal structure, macros and adherence tracking designed to feel polished and actionable.',
    tone: 'col-span-1 md:col-span-2 bg-orange-500 text-white',
  },
  {
    title: 'Progress Insights',
    copy: 'Strength, check-ins and compliance signals that help you coach with more precision.',
    tone: 'col-span-1 md:col-span-2 bg-zinc-900/80',
  },
  {
    title: 'Automated Check-ins',
    copy: 'Built-in accountability flows that help clients stay engaged without constant manual chasing.',
    tone: 'col-span-1 md:col-span-2 bg-zinc-800 text-white',
  },
]

const outcomes = [
  { value: '3x', label: 'Capacity', copy: 'Support more clients without increasing the operational chaos behind your service.' },
  { value: '12h', label: 'Time Saved', copy: 'Recover weekly admin time by centralizing routine delivery, tracking and follow-up.' },
  { value: '95%', label: 'Retention', copy: 'A clearer client experience improves trust, consistency and long-term coaching value.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative overflow-hidden border-b border-zinc-900 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.22),transparent_32%),radial-gradient(circle_at_85%_20%,rgba(255,255,255,0.08),transparent_18%),linear-gradient(180deg,#0a0a0a_0%,#050505_100%)]">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/5 to-transparent" />
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-6 sm:px-8 lg:px-10">
          <header className="sticky top-0 z-20 rounded-2xl border border-white/10 bg-black/35 px-5 py-4 backdrop-blur">
            <div className="flex items-center justify-between gap-6">
              <div className="flex min-w-0 items-center gap-4">
                <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/5" />
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold tracking-[-0.03em] text-white">{APP_NAME}</p>
                  <p className="truncate text-xs uppercase tracking-[0.22em] text-zinc-500">{APP_TAGLINE}</p>
                </div>
              </div>

              <nav className="hidden items-center gap-8 md:flex">
                <span className="text-sm font-medium text-orange-300">Platform</span>
                <span className="text-sm text-zinc-500">Coaching</span>
                <span className="text-sm text-zinc-500">Pricing</span>
                <span className="text-sm text-zinc-500">About</span>
              </nav>

              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" className="text-zinc-300 hover:bg-white/5 hover:text-white">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-orange-500 text-white hover:bg-orange-600">
                    Start Free
                  </Button>
                </Link>
              </div>
            </div>
          </header>

          <section className="grid gap-12 pb-20 pt-24 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div className="max-w-4xl">
              <Badge className="mb-6 border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-orange-200">
                The Professional Standard
              </Badge>
              <h1 className="max-w-5xl text-5xl font-semibold leading-[0.92] tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl xl:text-8xl">
                Scale Your Coaching.
                <br />
                <span className="text-zinc-500">Deliver Superior Results.</span>
              </h1>
              <p className="mt-8 max-w-2xl text-lg leading-8 text-zinc-400 sm:text-xl">
                Automate tracking, centralize client operations and deliver a cleaner premium experience for modern performance coaching.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link href="/register">
                  <Button size="lg" className="w-full bg-orange-500 px-8 text-white hover:bg-orange-600 sm:w-auto">
                    Start Free
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="w-full border-zinc-800 bg-zinc-950/70 px-8 text-zinc-200 hover:bg-zinc-900 sm:w-auto">
                    Login
                  </Button>
                </Link>
              </div>
            </div>

            <Card className="overflow-hidden border-zinc-800 bg-zinc-950/85 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
              <CardContent className="p-6 sm:p-8">
                <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,27,1),rgba(10,10,10,1))] p-6">
                  <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Platform snapshot</p>
                      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Operate with precision</p>
                    </div>
                    <div className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs text-orange-200">
                      Active
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4">
                    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
                      <div className="h-1 w-14 rounded-full bg-orange-500" />
                      <p className="mt-5 text-base font-semibold text-white">Guided onboarding and form assignment</p>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        Invite the client, assign the right form and keep the first experience aligned with your workflow.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
                        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Notifications</p>
                        <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white">Synced</p>
                        <p className="mt-2 text-sm text-zinc-500">Read state and badge count stay aligned.</p>
                      </div>
                      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
                        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Execution</p>
                        <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white">Structured</p>
                        <p className="mt-2 text-sm text-zinc-500">Sets, rests and logging feel clear from start to finish.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            {primaryLinks.map(item => (
              <div key={item} className="rounded-3xl border border-zinc-900 bg-zinc-950/80 p-5">
                <div className="h-1 w-12 rounded-full bg-orange-500" />
                <p className="mt-4 text-sm leading-6 text-zinc-300">{item}</p>
              </div>
            ))}
          </section>
        </div>
      </div>

      <section className="border-b border-zinc-900 bg-zinc-950/60 px-6 py-24 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-16 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">The Friction</p>
            <h2 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
              Manual management becomes the ceiling of your growth.
            </h2>
          </div>
          <div className="space-y-10">
            {frictionPoints.map(item => (
              <div key={item.title} className="border-b border-zinc-900 pb-8 last:border-b-0 last:pb-0">
                <p className="text-xl font-semibold tracking-[-0.03em] text-orange-200">{item.title}</p>
                <p className="mt-3 max-w-xl text-base leading-7 text-zinc-400">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.24em] text-orange-300">The Transformation</p>
            <h2 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
              Your expertise, accelerated by systems.
            </h2>
            <p className="mt-6 text-lg leading-8 text-zinc-400">
              Treinex centralizes the operational side of coaching so you can spend less energy managing clutter and more energy improving results.
            </p>
          </div>

          <div className="mt-16 grid gap-4 md:grid-cols-6">
            {featureBlocks.map(item => (
              <Card key={item.title} className={`overflow-hidden border-zinc-800 ${item.tone}`}>
                <CardContent className="flex h-full min-h-[240px] flex-col justify-between p-8">
                  <div className="h-1 w-14 rounded-full bg-white/80" />
                  <div>
                    <h3 className="text-2xl font-semibold tracking-[-0.04em] text-current">{item.title}</h3>
                    <p className={`mt-4 max-w-sm text-sm leading-7 ${item.tone.includes('text-white') ? 'text-white/80' : 'text-zinc-400'}`}>
                      {item.copy}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-900 bg-zinc-950/60 px-6 py-24 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs uppercase tracking-[0.24em] text-orange-300">The Result</p>
            <h2 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
              Elevate your business, not just your workouts.
            </h2>
          </div>

          <div className="mt-16 grid gap-10 md:grid-cols-3">
            {outcomes.map(item => (
              <div key={item.label} className="text-center">
                <p className="text-6xl font-semibold tracking-[-0.08em] text-orange-200">{item.value}</p>
                <p className="mt-4 text-xs uppercase tracking-[0.24em] text-zinc-500">{item.label}</p>
                <p className="mx-auto mt-4 max-w-xs text-base leading-7 text-zinc-400">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[32px] border border-zinc-800 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.28),transparent_24%),linear-gradient(180deg,#111111_0%,#090909_100%)] p-10 sm:p-14 lg:p-20">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.24em] text-orange-300">Ready to Scale</p>
            <h2 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              Ready to lead with precision?
            </h2>
            <p className="mt-6 text-lg leading-8 text-zinc-300">
              Join the trainers building a more premium, scalable and data-aware coaching operation with Treinex.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/register">
                <Button size="lg" className="w-full bg-orange-500 px-8 text-white hover:bg-orange-600 sm:w-auto">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full border-zinc-700 bg-transparent px-8 text-zinc-100 hover:bg-white/5 sm:w-auto">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-900 bg-zinc-950 px-6 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/5" />
              <div>
                <p className="text-lg font-semibold tracking-[-0.03em] text-white">{APP_NAME}</p>
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Precision in Performance</p>
              </div>
            </div>
            <p className="mt-6 text-xs uppercase tracking-[0.2em] text-zinc-500">© 2026 Treinex</p>
          </div>

          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Product</p>
            <p className="text-sm text-zinc-400">Features</p>
            <p className="text-sm text-zinc-400">Security</p>
            <p className="text-sm text-zinc-400">Pricing</p>
          </div>

          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Company</p>
            <p className="text-sm text-zinc-400">About</p>
            <p className="text-sm text-zinc-400">Legal</p>
            <p className="text-sm text-zinc-400">Privacy</p>
          </div>

          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Access</p>
            <Link href="/login" className="block text-sm text-zinc-400 transition hover:text-white">Login</Link>
            <Link href="/register" className="block text-sm text-zinc-400 transition hover:text-white">Start Free</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
