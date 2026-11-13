// Public landing page, shown at "/" to visitors who aren't logged in.
// Logged-in users are still redirected to their dashboard (see Home in App.tsx).
//
// The hero is built around FitLab's own signature, the 7-day training strip,
// shown with clearly labelled sample data.

import { Link } from "react-router-dom"
import {
  ArrowRight,
  Bot,
  CalendarClock,
  ClipboardList,
  LineChart,
  Link2,
  Search,
  UserPlus,
  Users,
} from "lucide-react"

import { FitLabLogo } from "@/components/AuthShell"
import WeekStrip from "@/components/client/dashboard/WeekStrip"
import { Button } from "@/components/ui/button"

// Sample week for the hero: trained 4 of the last 7 days (today included).
function sampleWeek() {
  const today = new Date()
  return [0, 1, 3, 5].map((daysAgo) => {
    const d = new Date(today)
    d.setDate(today.getDate() - daysAgo)
    return { session_date: d.toISOString() }
  })
}

const CLIENT_FEATURES = [
  {
    icon: ClipboardList,
    title: "Log sessions from templates",
    text: "Save your go-to exercises once, then log sets, reps and weight in a few taps.",
  },
  {
    icon: LineChart,
    title: "See progress, not just numbers",
    text: "Weight-over-time charts, weekly volume and your personal bests, all in one place.",
  },
  {
    icon: Search,
    title: "Find the right trainer",
    text: "Browse trainer listings and send a request to the one that fits your goals.",
  },
]

const TRAINER_FEATURES = [
  {
    icon: Users,
    title: "All your clients in one view",
    text: "Each client's sessions, progress and personal bests, without chasing spreadsheets.",
  },
  {
    icon: CalendarClock,
    title: "Schedule and reschedule",
    text: "Plan sessions on a calendar and move them when life happens.",
  },
  {
    icon: Search,
    title: "Get discovered",
    text: "Publish a listing so clients looking for a coach can find you.",
  },
]

const STEPS = [
  { icon: UserPlus, title: "Create an account", text: "Sign up as a client or a trainer. It takes a minute." },
  { icon: Link2, title: "Link up", text: "Clients and trainers connect with a link request by email." },
  { icon: CalendarClock, title: "Train and review", text: "Log each session and review the week together." },
]

function FeatureList({
  heading,
  features,
}: {
  heading: string
  features: typeof CLIENT_FEATURES
}) {
  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgb(11_21_48/0.04)] sm:p-8">
      <h3 className="font-display text-2xl font-bold tracking-tight">{heading}</h3>
      <ul className="flex flex-col gap-5">
        {features.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
              <Icon className="size-5" />
            </span>
            <div>
              <div className="font-semibold">{title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar — log in sits top-right like any site */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <FitLabLogo />
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="press font-semibold">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild className="press font-semibold">
              <Link to="/register">Get started</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-24 px-4 pt-6 pb-24 sm:px-6">
        {/* Hero */}
        <section className="overflow-hidden rounded-3xl bg-primary bg-fl-banner text-white selection:bg-white/30 selection:text-white">
          <div className="flex flex-col gap-10 p-6 sm:p-10 lg:p-14">
            <div className="flex flex-col gap-6">
              <h1 className="max-w-3xl font-display text-4xl leading-[1.05] font-bold tracking-tight text-balance sm:text-6xl">
                Train with your coach. See every week add up.
              </h1>
              <p className="max-w-xl text-lg text-white/90">
                FitLab connects clients and personal trainers: log your sessions,
                track your progress, and keep both of you on the same page.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  className="press h-11 bg-white px-5 text-base font-semibold text-[#1238c9] hover:bg-white/90 focus-visible:ring-white/70"
                >
                  <Link to="/register">
                    Create your account <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="press h-11 border-white/50 bg-transparent px-5 text-base font-semibold text-white hover:bg-white/10 hover:text-white focus-visible:ring-white/70"
                >
                  <Link to="/login">I already have an account</Link>
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl bg-white/10 p-4 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold">Your last 7 days at a glance</p>
                <p className="text-sm text-white/85">Sample week · 4 sessions</p>
              </div>
              <WeekStrip sessions={sampleWeek()} size="lg" label="Sample training week" />
            </div>
          </div>
        </section>

        {/* For clients / for trainers */}
        <section className="flex flex-col gap-8" aria-labelledby="both-sides">
          <div className="max-w-2xl">
            <h2 id="both-sides" className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Built for both sides of the session
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Whether you're putting in the reps or coaching them, FitLab keeps the
              training history in one shared place.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <FeatureList heading="For clients" features={CLIENT_FEATURES} />
            <FeatureList heading="For trainers" features={TRAINER_FEATURES} />
          </div>
          <div className="flex items-start gap-4 rounded-2xl border border-border bg-secondary/60 p-6">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bot className="size-5" />
            </span>
            <div>
              <div className="font-semibold">Questions mid-workout?</div>
              <p className="mt-1 text-sm text-muted-foreground">
                The built-in FitLab AI chat answers training questions whenever you're logged in.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="flex flex-col gap-8" aria-labelledby="how">
          <h2 id="how" className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Up and running in three steps
          </h2>
          <ol className="grid gap-6 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex flex-col gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Icon className="size-5" />
                </span>
                <div className="text-lg font-semibold">{title}</div>
                <p className="text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Closing call to action */}
        <section className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-border bg-card p-8 shadow-[0_1px_2px_rgb(11_21_48/0.04)] sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight">Ready for your next session?</h2>
            <p className="mt-2 text-muted-foreground">Free to join for clients and trainers.</p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline" className="press h-11 px-5 font-semibold">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild className="press h-11 px-5 font-semibold">
              <Link to="/register">Get started</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6">
          <span>© {new Date().getFullYear()} FitLab</span>
          <div className="flex gap-6">
            <Link to="/login" className="hover:text-foreground">Log in</Link>
            <Link to="/register" className="hover:text-foreground">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
