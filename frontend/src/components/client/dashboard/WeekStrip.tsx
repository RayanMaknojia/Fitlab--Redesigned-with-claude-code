// Last-7-days activity strip shown in the dashboard banner.
// Uses the same rolling 7-day window as stats.sessions_this_week, so the
// strip and the number always agree. Trained days fill in on load
// (the dashboard's one signature animation; see .animate-day-fill).

import { Check } from "lucide-react"

import type { WorkoutSession } from "@/types"
import { cn } from "@/lib/utils"

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export default function WeekStrip({
  sessions,
  size = "md",
  label = "Training over the last 7 days",
}: {
  sessions: Pick<WorkoutSession, "session_date">[]
  size?: "md" | "lg"
  label?: string
}) {
  const today = new Date()
  const counts = new Map<string, number>()
  for (const s of sessions) {
    const k = dayKey(new Date(s.session_date))
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    return { date: d, count: counts.get(dayKey(d)) ?? 0, isToday: i === 6 }
  })

  let filledIndex = 0

  return (
    <ol className={cn("grid grid-cols-7", size === "lg" ? "gap-2 sm:gap-3" : "gap-1.5 sm:gap-2")} aria-label={label}>
      {days.map(({ date, count, isToday }) => {
        const trained = count > 0
        const weekday = date.toLocaleDateString(undefined, { weekday: "short" })
        const label = `${date.toLocaleDateString(undefined, {
          weekday: "long",
          month: "short",
          day: "numeric",
        })}: ${trained ? `${count} session${count === 1 ? "" : "s"}` : "rest day"}`
        const i = trained ? filledIndex++ : 0

        return (
          <li
            key={dayKey(date)}
            aria-label={label}
            className={cn(
              "relative flex flex-col items-center justify-between rounded-lg bg-white/12 px-1 text-white",
              size === "lg" ? "h-24 py-3 sm:h-32 sm:py-4" : "h-[4.5rem] py-2",
              isToday && "ring-2 ring-white/80 ring-offset-0",
            )}
          >
            {trained && (
              <span
                aria-hidden
                style={{ "--i": i } as React.CSSProperties}
                className="absolute inset-0 animate-day-fill rounded-lg bg-white"
              />
            )}
            <span
              className={cn(
                "relative font-medium",
                size === "lg" ? "text-xs sm:text-sm" : "text-xs",
                trained ? "text-[#1238c9]" : "text-white",
              )}
            >
              {isToday ? "Today" : weekday}
            </span>
            <span
              className={cn(
                "relative flex items-center justify-center font-semibold",
                size === "lg" ? "size-8 text-base sm:text-lg" : "size-6 text-sm",
                trained ? "text-[#1238c9]" : "text-white/90",
              )}
            >
              {trained ? <Check className={size === "lg" ? "size-5 sm:size-6" : "size-4"} strokeWidth={3} /> : date.getDate()}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
