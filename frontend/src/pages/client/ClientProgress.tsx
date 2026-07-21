// Client progress page — weight-over-time per exercise + weekly training
// volume. This is the "graphs" feature.
// Owned by: [your name] (progress dashboard / client view).

import { useEffect, useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { ProgressPoint, WeeklyVolume } from "@/types/client"
import { getExerciseNames, getWeeklyVolume, getWeightProgress } from "@/lib/clientApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// same accent used across the trainer UI, for chart strokes/fills
const LIME = "#a3e635" // tailwind lime-400
const GRID = "oklch(1 0 0 / 10%)"
const AXIS_TEXT = "oklch(0.708 0 0)" // matches --muted-foreground in dark mode

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function formatWeek(iso: string) {
  return `Wk of ${formatDate(iso)}`
}

function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean
  payload?: { value: number; name: string }[]
  label?: string
  unit: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border/60 bg-popover px-3 py-2 text-xs shadow-md">
      <div className="font-medium text-popover-foreground">{label}</div>
      <div className="mt-0.5 text-lime-300">
        {payload[0].value} {unit}
      </div>
    </div>
  )
}

export default function ClientProgress() {
  const [exercises, setExercises] = useState<string[]>([])
  const [selected, setSelected] = useState<string>("")
  const [progress, setProgress] = useState<ProgressPoint[]>([])
  const [volume, setVolume] = useState<WeeklyVolume[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([getExerciseNames(), getWeeklyVolume()]).then(([names, vol]) => {
      if (cancelled) return
      setExercises(names)
      setSelected((prev) => prev || names[0] || "")
      setVolume(vol)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selected) return
    getWeightProgress(selected).then(setProgress)
  }, [selected])

  const volumeData = useMemo(
    () =>
      volume.map((v) => ({
        label: formatWeek(v.week_start),
        volume: Math.round(v.volume),
      })),
    [volume]
  )

  const progressData = useMemo(
    () =>
      progress.map((p) => ({
        label: formatDate(p.date),
        weight: p.weight_in_kg,
      })),
    [progress]
  )

  const latest = progress[progress.length - 1]
  const first = progress[0]
  const delta = latest && first ? latest.weight_in_kg - first.weight_in_kg : 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Progress<span className="text-lime-400">.</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track how your lifts and training volume have changed over time.
        </p>
      </div>

      {/* Weight over time, per exercise */}
      <Card className="border-border/60 bg-card/60 py-5 backdrop-blur">
        <CardHeader className="flex-row items-center justify-between gap-4 px-5">
          <CardTitle className="text-sm">Weight progress</CardTitle>
          {exercises.length > 0 && (
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="rounded-lg border border-input bg-input/30 px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {exercises.map((name) => (
                <option key={name} value={name} className="bg-popover text-popover-foreground">
                  {name}
                </option>
              ))}
            </select>
          )}
        </CardHeader>
        <CardContent className="px-5">
          {loading ? (
            <div className="h-64 animate-pulse rounded-lg bg-muted/40" />
          ) : progressData.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No weighted sets logged for this exercise yet.
            </p>
          ) : (
            <>
              {latest && (
                <div className="mb-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight">
                    {latest.weight_in_kg} kg
                  </span>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      delta > 0 && "text-lime-400",
                      delta < 0 && "text-destructive",
                      delta === 0 && "text-muted-foreground"
                    )}
                  >
                    {delta > 0 ? "+" : ""}
                    {delta} kg since first logged set
                  </span>
                </div>
              )}
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={progressData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke={AXIS_TEXT}
                    tick={{ fontSize: 11, fill: AXIS_TEXT }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke={AXIS_TEXT}
                    tick={{ fontSize: 11, fill: AXIS_TEXT }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip content={<ChartTooltip unit="kg" />} cursor={{ stroke: GRID }} />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke={LIME}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: LIME, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </CardContent>
      </Card>

      {/* Weekly training volume */}
      <Card className="border-border/60 bg-card/60 py-5 backdrop-blur">
        <CardHeader className="px-5">
          <CardTitle className="text-sm">Weekly training volume</CardTitle>
          <p className="text-xs text-muted-foreground">
            Total sets × reps × weight lifted, per week, across all exercises.
          </p>
        </CardHeader>
        <CardContent className="px-5">
          {loading ? (
            <div className="h-64 animate-pulse rounded-lg bg-muted/40" />
          ) : volumeData.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No sessions logged yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={volumeData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke={AXIS_TEXT}
                  tick={{ fontSize: 11, fill: AXIS_TEXT }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke={AXIS_TEXT}
                  tick={{ fontSize: 11, fill: AXIS_TEXT }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                />
                <Tooltip content={<ChartTooltip unit="kg lifted" />} cursor={{ fill: GRID }} />
                <Bar dataKey="volume" fill={LIME} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
