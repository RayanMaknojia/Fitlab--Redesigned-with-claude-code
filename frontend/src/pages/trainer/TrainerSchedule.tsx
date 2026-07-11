// Trainer schedule — month calendar of training sessions (time + client).
// Clicking a session opens the reschedule request dialog.

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import type { ScheduleEvent } from "@/types"
import { getScheduleEvents } from "@/lib/trainerApi"
import RescheduleDialog from "@/components/trainer/RescheduleDialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// per-client chip colors (index matches dashboard avatar hues)
const EVENT_HUES = [
  "border-lime-400/40 bg-lime-400/10 text-lime-300 hover:bg-lime-400/20",
  "border-cyan-400/40 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20",
  "border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-300 hover:bg-fuchsia-400/20",
  "border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20",
  "border-rose-400/40 bg-rose-400/10 text-rose-300 hover:bg-rose-400/20",
]

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function timeLabel(iso: string) {
  return new Date(iso)
    .toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    .toLowerCase()
    .replace(" ", "")
}

/** All cells of the month grid: full weeks from Sunday before the 1st. */
function monthCells(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const start = new Date(first)
  start.setDate(1 - first.getDay())
  const cells: Date[] = []
  const cursor = new Date(start)
  do {
    cells.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  } while (cursor.getMonth() === month || cells.length % 7 !== 0)
  return cells
}

export default function TrainerSchedule() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ScheduleEvent | null>(null)

  useEffect(() => {
    let cancelled = false
    getScheduleEvents().then((e) => {
      if (!cancelled) {
        setEvents(e)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const byDay = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>()
    for (const event of events) {
      const key = dayKey(new Date(event.start_time))
      map.set(key, [...(map.get(key) ?? []), event])
    }
    return map
  }, [events])

  const cells = useMemo(() => monthCells(year, month), [year, month])

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  const goToday = () => {
    setYear(today.getFullYear())
    setMonth(today.getMonth())
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  })

  const monthCount = events.filter((e) => {
    const d = new Date(e.start_time)
    return d.getFullYear() === year && d.getMonth() === month
  }).length

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Schedul<span className="text-lime-400">e</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {monthCount} session{monthCount === 1 ? "" : "s"} in {monthLabel}.
            Click a session to request a reschedule.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Previous month"
            onClick={() => shiftMonth(-1)}
          >
            <ChevronLeft />
          </Button>
          <span className="min-w-36 text-center text-sm font-semibold">
            {monthLabel}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Next month"
            onClick={() => shiftMonth(1)}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      {!loading && events.length === 0 && (
        <div className="rounded-lg border border-dashed border-border/70 p-4 text-center text-sm text-muted-foreground">
          No sessions scheduled — link a client from the dashboard and their
          training sessions will show up here.
        </div>
      )}

      {/* Calendar */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card/40 backdrop-blur">
        <div className="grid grid-cols-7 border-b border-border/60">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="px-2 py-2 text-center text-[11px] font-semibold tracking-widest text-muted-foreground uppercase"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((date) => {
            const inMonth = date.getMonth() === month
            const isToday = sameDay(date, today)
            const dayEvents = byDay.get(dayKey(date)) ?? []
            return (
              <div
                key={date.toISOString()}
                className={cn(
                  "min-h-24 border-t border-r border-border/40 p-1.5 [&:nth-child(7n)]:border-r-0",
                  !inMonth && "bg-background/40"
                )}
              >
                <div
                  className={cn(
                    "mx-auto flex size-6 items-center justify-center rounded-full text-xs",
                    !inMonth && "text-muted-foreground/50",
                    isToday && "bg-lime-400 font-bold text-black"
                  )}
                >
                  {date.getDate()}
                </div>
                <div className="mt-1 flex flex-col gap-1">
                  {dayEvents.map((event) => (
                    <button
                      key={`${event.client_id}-${event.start_time}`}
                      onClick={() => setSelected(event)}
                      title={`${event.client_name} · ${timeLabel(event.start_time)} · ${event.duration} min — click to request a reschedule`}
                      className={cn(
                        "w-full truncate rounded-md border px-1.5 py-0.5 text-left text-[11px] font-medium transition-colors",
                        EVENT_HUES[event.client_index % EVENT_HUES.length],
                        !inMonth && "opacity-50"
                      )}
                    >
                      <span className="opacity-75">{timeLabel(event.start_time)}</span>{" "}
                      {event.client_name.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <RescheduleDialog event={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
