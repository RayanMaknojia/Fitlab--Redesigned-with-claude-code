// Client schedule — upcoming training sessions (booked by the client or their
// trainer), trainer reschedule requests to accept/decline, and booking a
// personal session. Uses the existing /clients/me/schedules routes.

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import { ArrowRight, CalendarPlus, Clock, Loader2, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/AuthContext"
import {
  bookSession,
  cancelSession,
  getMySchedules,
  respondToReschedule,
  type ClientScheduleEntry,
} from "@/lib/clientScheduleApi"
import { cn } from "@/lib/utils"

const DURATIONS = [30, 45, 60, 90]

const fmtTime = (d: Date) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
const fmtDay = (d: Date) =>
  d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
const endOf = (start: Date, minutes: number) => new Date(start.getTime() + minutes * 60_000)

function dayLabel(d: Date) {
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)
  if (d.toDateString() === today.toDateString()) return "Today"
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow"
  return fmtDay(d)
}

function toLocalDateInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function BookSessionDialog({ onBook }: { onBook: (start: Date, minutes: number) => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(toLocalDateInput(new Date()))
  const [time, setTime] = useState("18:00")
  const [minutes, setMinutes] = useState(60)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const start = new Date(`${date}T${time}`)
    if (Number.isNaN(start.getTime())) return setError("Pick a valid date and time.")
    if (start.getTime() < Date.now()) return setError("Pick a time in the future.")
    setBusy(true)
    try {
      await onBook(start, minutes)
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not book the session.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setError(null)
      }}
    >
      <DialogTrigger asChild>
        <Button className="press w-max font-semibold">
          <CalendarPlus data-icon="inline-start" /> Book a session
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-5 sm:max-w-md">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle className="text-lg">Book a training session</DialogTitle>
            <DialogDescription>
              Add a personal session to your schedule. Sessions your trainer books show up here
              automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="book-date">Date</Label>
              <Input id="book-date" type="date" required value={date} min={toLocalDateInput(new Date())} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="book-time">Start time</Label>
              <Input id="book-time" type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-sm font-medium">Length</legend>
            <div className="grid grid-cols-4 gap-2">
              {DURATIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={minutes === m}
                  onClick={() => setMinutes(m)}
                  className={cn(
                    "press rounded-lg border px-2 py-2 text-sm font-medium transition-colors",
                    minutes === m
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/50 hover:bg-secondary",
                  )}
                >
                  {m} min
                </button>
              ))}
            </div>
          </fieldset>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="press">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className="press font-semibold" disabled={busy}>
              {busy && <Loader2 data-icon="inline-start" className="animate-spin" />}
              Book session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SessionRow({
  s,
  past,
  onCancel,
}: {
  s: ClientScheduleEntry
  past?: boolean
  onCancel?: (id: string) => Promise<void>
}) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const start = new Date(s.start_time)
  const end = endOf(start, s.duration_in_minutes)

  return (
    <li className="flex flex-wrap items-center gap-4 rounded-lg px-3 py-3 transition-colors [@media(hover:hover)]:hover:bg-muted/60">
      <div className="w-28 shrink-0">
        <div className={cn("text-sm font-semibold tabular-nums", past && "text-muted-foreground")}>
          {fmtTime(start)}
        </div>
        <div className="text-xs text-muted-foreground tabular-nums">to {fmtTime(end)}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm font-medium">
          {s.trainer_name ? (
            <>
              <UserRound className="size-4 text-primary" aria-hidden /> With {s.trainer_name}
            </>
          ) : (
            "Personal session"
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3.5" aria-hidden /> {s.duration_in_minutes} min
          {past && ` · ${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
        </div>
      </div>
      {onCancel &&
        (confirming ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Cancel this session?</span>
            <Button size="sm" variant="outline" className="press" onClick={() => setConfirming(false)} disabled={busy}>
              Keep
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="press"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                try {
                  await onCancel(s.schedule_id)
                } finally {
                  setBusy(false)
                  setConfirming(false)
                }
              }}
            >
              {busy && <Loader2 data-icon="inline-start" className="animate-spin" />}
              Cancel session
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" className="press text-muted-foreground" onClick={() => setConfirming(true)}>
            Cancel
          </Button>
        ))}
    </li>
  )
}

export default function ClientSchedule() {
  const { user } = useAuth()
  const [items, setItems] = useState<ClientScheduleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [responding, setResponding] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setItems(await getMySchedules())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your schedule.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const now = Date.now()
  const { pending, upcomingByDay, past } = useMemo(() => {
    const sorted = [...items].sort((a, b) => a.start_time.localeCompare(b.start_time))
    const pending = sorted.filter((s) => s.reschedule_request?.status === "pending")
    const upcoming = sorted.filter((s) => endOf(new Date(s.start_time), s.duration_in_minutes).getTime() >= now)
    const past = sorted.filter((s) => endOf(new Date(s.start_time), s.duration_in_minutes).getTime() < now).reverse().slice(0, 5)
    const groups = new Map<string, ClientScheduleEntry[]>()
    for (const s of upcoming) {
      const k = new Date(s.start_time).toDateString()
      groups.set(k, [...(groups.get(k) ?? []), s])
    }
    return { pending, upcomingByDay: [...groups.entries()], past }
  }, [items, now])

  const book = async (start: Date, minutes: number) => {
    await bookSession(user!.id, { start_time: start.toISOString(), duration_in_minutes: minutes })
    await load()
  }

  const cancel = async (id: string) => {
    try {
      await cancelSession(id)
      setItems((prev) => prev.filter((s) => s.schedule_id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not cancel the session.")
    }
  }

  const respond = async (id: string, action: "accept" | "decline") => {
    setResponding(id + action)
    try {
      await respondToReschedule(id, action)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send your answer.")
    } finally {
      setResponding(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Schedule</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your upcoming training sessions, including ones your trainer books.
          </p>
        </div>
        <BookSessionDialog onBook={book} />
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Reschedule requests from the trainer */}
      {pending.length > 0 && (
        <section className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-secondary/60 p-4 sm:p-5">
          <h2 className="text-base font-semibold">
            {pending.length === 1 ? "Your trainer wants to move a session" : `${pending.length} reschedule requests`}
          </h2>
          <ul className="flex flex-col gap-3">
            {pending.map((s) => {
              const rr = s.reschedule_request!
              const from = new Date(s.start_time)
              const to = new Date(rr.proposed_start_time)
              return (
                <li key={s.schedule_id} className="flex flex-wrap items-center gap-4 rounded-lg bg-card p-4 shadow-[0_1px_2px_rgb(11_21_48/0.04)]">
                  <div className="min-w-0 flex-1 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-muted-foreground line-through">
                        {fmtDay(from)}, {fmtTime(from)}
                      </span>
                      <ArrowRight className="size-4 text-primary" aria-label="moves to" />
                      <span className="font-semibold">
                        {fmtDay(to)}, {fmtTime(to)} · {rr.proposed_duration_in_minutes} min
                      </span>
                    </div>
                    {rr.message && <p className="mt-1 text-muted-foreground">“{rr.message}”</p>}
                    {s.trainer_name && <p className="mt-1 text-xs text-muted-foreground">From {s.trainer_name}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="press" disabled={!!responding} onClick={() => respond(s.schedule_id, "decline")}>
                      {responding === s.schedule_id + "decline" && <Loader2 data-icon="inline-start" className="animate-spin" />}
                      Decline
                    </Button>
                    <Button size="sm" className="press font-semibold" disabled={!!responding} onClick={() => respond(s.schedule_id, "accept")}>
                      {responding === s.schedule_id + "accept" && <Loader2 data-icon="inline-start" className="animate-spin" />}
                      Accept new time
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* Upcoming */}
      <section className="flex flex-col rounded-xl border border-border bg-card shadow-[0_1px_2px_rgb(11_21_48/0.04)]">
        <h2 className="border-b border-border px-5 py-4 text-base font-semibold">Upcoming</h2>
        <div className="p-2">
          {loading ? (
            [0, 1, 2].map((i) => <div key={i} className="m-1 h-14 animate-pulse rounded-lg bg-muted" />)
          ) : upcomingByDay.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <p className="font-medium">Nothing scheduled yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Book a personal session, or ask your trainer to schedule one. It will appear here.
              </p>
            </div>
          ) : (
            <div className="flex animate-fade-in flex-col gap-2">
              {upcomingByDay.map(([key, list]) => (
                <div key={key}>
                  <h3 className="px-3 pt-3 pb-1 text-sm font-semibold text-primary">
                    {dayLabel(new Date(list[0].start_time))}
                  </h3>
                  <ul className="flex flex-col">
                    {list.map((s) => (
                      <SessionRow key={s.schedule_id} s={s} onCancel={cancel} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recent */}
      {!loading && past.length > 0 && (
        <section className="flex flex-col rounded-xl border border-border bg-card shadow-[0_1px_2px_rgb(11_21_48/0.04)]">
          <h2 className="border-b border-border px-5 py-4 text-base font-semibold">Recent</h2>
          <ul className="flex flex-col p-2">
            {past.map((s) => (
              <SessionRow key={s.schedule_id} s={s} past />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
