// Client dashboard — overview of the logged-in client's own training.
// Owned by: [your name] (progress dashboard / client view).

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowUpRight, Dumbbell, Flame, TrendingUp } from "lucide-react"

import type { ClientStats } from "@/types/client"
import type { WorkoutSession } from "@/types"
import { getMySessions, getStats } from "@/lib/clientApi"
import MyTrainerCard from "@/components/client/MyTrainerCard"
import StatTile from "@/components/client/StatTile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

export default function ClientDashboard() {
  const [stats, setStats] = useState<ClientStats | null>(null)
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([getStats(), getMySessions()]).then(([s, sess]) => {
      if (cancelled) return
      setStats(s)
      setSessions(sess.slice(0, 5))
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Your Progress<span className="text-lime-400">.</span>
          </h1>
        </div>
        <Button asChild className="bg-lime-400 font-semibold text-black hover:bg-lime-300">
          <Link to="/client/progress">
            View progress <ArrowUpRight data-icon="inline-end" />
          </Link>
        </Button>
      </div>

      {/* Stats */}
      {loading || !stats ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[72px] flex-1 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row">
          <StatTile icon={Dumbbell} label="Total sessions" value={stats.total_sessions} />
          <StatTile icon={Flame} label="Sessions this week" value={stats.sessions_this_week} />
          <StatTile
            icon={TrendingUp}
            label="Current streak"
            value={`${stats.current_streak_weeks} wk${stats.current_streak_weeks === 1 ? "" : "s"}`}
          />
        </div>
      )}

      {/* Trainer link — send/accept link requests, see your trainer */}
      <MyTrainerCard />

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Recent sessions */}
        <Card className="border-border/60 bg-card/60 py-5 backdrop-blur lg:col-span-3">
          <CardHeader className="px-5">
            <CardTitle className="text-sm">Recent sessions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 px-5">
            {sessions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No sessions logged yet.
              </p>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.session_id}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 p-3"
                >
                  <div>
                    <div className="text-sm font-medium">{formatDate(s.session_date)}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.exercises.map((e) => e.name).join(" · ")}
                    </div>
                  </div>
                  <Badge variant="secondary">{s.exercises.length} exercises</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Personal bests */}
        <Card className="border-border/60 bg-card/60 py-5 backdrop-blur lg:col-span-2">
          <CardHeader className="px-5">
            <CardTitle className="text-sm">Personal bests</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 px-5">
            {!stats || stats.personal_bests.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Log a session to see your bests here.
              </p>
            ) : (
              stats.personal_bests.slice(0, 5).map((pb) => (
                <div
                  key={pb.exercise}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 p-3"
                >
                  <span className="text-sm font-medium">{pb.exercise}</span>
                  <span className="text-sm font-semibold text-lime-300">
                    {pb.weight_in_kg} kg × {pb.reps}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
