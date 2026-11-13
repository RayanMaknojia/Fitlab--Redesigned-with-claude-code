// Client dashboard — overview of the logged-in client's own training.
// Owned by: [your name] (progress dashboard / client view).
//
// Visual: FitLab light theme (tokens in index.css).
// Banner photo: frontend/public/images/dashboard-hero.jpg
//   "Woman performing a yoga handstand on a rooftop at sunset"
//   by Marvin Alexander Avila on Unsplash (Unsplash License)
//   https://unsplash.com/photos/VAPMuCqepWc

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowUpRight, CalendarCheck, Dumbbell, Flame, Trophy } from "lucide-react"

import type { ClientStats } from "@/types/client"
import type { WorkoutSession } from "@/types"
import { getMySessions, getStats } from "@/lib/clientApi"
import { useAuth } from "@/context/AuthContext"
import MyTrainerCard from "@/components/client/MyTrainerCard"
import StatPanel, { StatPanelSkeleton } from "@/components/client/dashboard/StatPanel"
import WeekStrip from "@/components/client/dashboard/WeekStrip"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const HERO_SRC = "/images/dashboard-hero.jpg"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

function weekSummary(stats: ClientStats | null, loading: boolean) {
  if (loading || !stats) return "Loading your week…"
  const n = stats.sessions_this_week
  if (n === 0) return "No sessions in the last 7 days yet. Today is a good day to start."
  return `You trained ${n} time${n === 1 ? "" : "s"} in the last 7 days. Keep the rhythm going.`
}

function BannerPhoto() {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    <div className="relative hidden w-64 shrink-0 p-3 lg:block xl:w-80 2xl:w-[26rem]">
      <img
        src={HERO_SRC}
        alt="Athlete holding a yoga handstand on a rooftop at sunset"
        onError={() => setFailed(true)}
        className="size-full rounded-xl object-cover object-[50%_45%] shadow-[0_8px_24px_-8px_rgb(6_20_80/0.45)]"
      />
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col rounded-xl border border-border bg-card shadow-[0_1px_2px_rgb(11_21_48/0.04)]">
      <h2 className="border-b border-border px-5 py-4 text-base font-semibold">{title}</h2>
      <div className="flex flex-col p-2">{children}</div>
    </section>
  )
}

export default function ClientDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<ClientStats | null>(null)
  const [allSessions, setAllSessions] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([getStats(), getMySessions()]).then(([s, sess]) => {
      if (cancelled) return
      setStats(s)
      setAllSessions(sess)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const sessions = allSessions.slice(0, 5)
  const firstName = user?.name.split(" ")[0]
  const streak = stats?.current_streak_weeks ?? 0

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome banner — the week at a glance leads the page */}
      <section className="flex overflow-hidden rounded-2xl bg-primary bg-fl-banner text-white selection:bg-white/30 selection:text-white shadow-[0_12px_32px_-16px_rgb(18_56_201/0.55)]">
        <div className="flex min-w-0 flex-1 flex-col gap-6 p-6 sm:p-8">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              {greeting()}
              {firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="mt-2 max-w-prose text-base text-white/90">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
              {" · "}
              {weekSummary(stats, loading)}
            </p>
          </div>

          <div className="max-w-xl">{!loading && <WeekStrip sessions={allSessions} />}
            {loading && (
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2" aria-hidden>
                {Array.from({ length: 7 }, (_, i) => (
                  <div key={i} className="h-[4.5rem] animate-pulse rounded-lg bg-white/12" />
                ))}
              </div>
            )}
          </div>

          <div>
            <Button
              asChild
              className="press h-10 rounded-lg bg-white px-4 font-semibold text-[#1238c9] shadow-sm hover:bg-white/90 focus-visible:ring-white/70"
            >
              <Link to="/client/progress">
                View progress <ArrowUpRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>
        <BannerPhoto />
      </section>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {loading || !stats ? (
          [0, 1, 2].map((i) => <StatPanelSkeleton key={i} />)
        ) : (
          <>
            <StatPanel
              icon={CalendarCheck}
              label="Sessions this week"
              value={stats.sessions_this_week}
              note="In the last 7 days"
            />
            <StatPanel
              icon={Flame}
              label="Current streak"
              value={`${streak} wk${streak === 1 ? "" : "s"}`}
              note={streak > 0 ? "Weeks in a row with a session" : "Train this week to start one"}
            />
            <StatPanel
              icon={Dumbbell}
              label="Total sessions"
              value={stats.total_sessions}
              note="Since you joined FitLab"
            />
          </>
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        {/* Recent sessions */}
        <div className="lg:col-span-2">
          <Panel title="Recent sessions">
            {loading ? (
              [0, 1, 2].map((i) => (
                <div key={i} className="m-1 h-14 animate-pulse rounded-lg bg-muted" />
              ))
            ) : sessions.length === 0 ? (
              <p className="px-3 py-10 text-center text-sm text-muted-foreground">
                No sessions logged yet. Once you log a workout, your latest five show up here.
              </p>
            ) : (
              <ul className="flex animate-fade-in flex-col">
                {sessions.map((s) => {
                  const d = new Date(s.session_date)
                  return (
                    <li
                      key={s.session_id}
                      className="flex items-center gap-4 rounded-lg px-3 py-3 transition-colors duration-150 [@media(hover:hover)]:hover:bg-muted/70"
                    >
                      <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                        <span className="text-[11px] leading-none font-medium uppercase">
                          {d.toLocaleDateString(undefined, { month: "short" })}
                        </span>
                        <span className="mt-0.5 text-lg leading-none font-semibold">
                          {d.getDate()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{formatDate(s.session_date)}</div>
                        <div className="truncate text-sm text-muted-foreground">
                          {s.exercises.map((e) => e.name).join(" · ")}
                        </div>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {s.exercises.length} exercises
                      </Badge>
                    </li>
                  )
                })}
              </ul>
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          {/* Trainer link — send/accept link requests, see your trainer */}
          <MyTrainerCard />

          {/* Personal bests */}
          <Panel title="Personal bests">
            {!stats || stats.personal_bests.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                Log a session to see your bests here.
              </p>
            ) : (
              <ul className="flex animate-fade-in flex-col">
                {stats.personal_bests.slice(0, 5).map((pb) => (
                  <li
                    key={pb.exercise}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                  >
                    <Trophy className="size-4 shrink-0 text-amber-500" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{pb.exercise}</span>
                    <span className="shrink-0 text-sm font-semibold text-primary">
                      {pb.weight_in_kg} kg × {pb.reps}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
