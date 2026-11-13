// Reschedule request form. Sends the proposal to the backend
// (POST /api/trainers/me/schedules/:id/reschedule-request); the client
// then accepts (schedule moves) or declines from their side.

import { useState } from "react"
import { CalendarClock, Loader2 } from "lucide-react"

import type { TrainerScheduleEntry } from "@/types"
import { requestReschedule } from "@/lib/trainerApi"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function formatSession(event: TrainerScheduleEntry) {
  const d = new Date(event.start_time)
  return `${d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })} · ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · ${
    event.duration_in_minutes
  } min`
}

export default function RescheduleDialog({
  event,
  onClose,
  onSent,
}: {
  event: TrainerScheduleEntry | null
  onClose: () => void
  onSent?: () => void
}) {
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  // null = untouched → default to the duration of the session being moved.
  const [durationInput, setDurationInput] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const duration =
    durationInput ?? (event ? String(event.duration_in_minutes) : "60")

  const close = () => {
    setDate("")
    setTime("")
    setDurationInput(null)
    setMessage("")
    setSent(false)
    setError(null)
    onClose()
  }

  const valid = date && time && Number(duration) > 0

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!event || !valid) return
    setBusy(true)
    setError(null)
    try {
      await requestReschedule(event.schedule_id, {
        proposed_start_time: new Date(`${date}T${time}`).toISOString(),
        proposed_duration_in_minutes: Number(duration),
        ...(message.trim() && { message: message.trim() }),
      })
      setSent(true)
      onSent?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={event !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="size-5 text-primary" />
            Request a reschedule
          </DialogTitle>
          <DialogDescription>
            {event && (
              <>
                Session with{" "}
                <span className="font-medium text-foreground">
                  {event.client_name}
                </span>{" "}
                — {formatSession(event)}
                {event.reschedule_request?.status === "pending" && (
                  <span className="mt-1 block text-xs">
                    A proposal is already pending — sending a new one replaces
                    it.
                  </span>
                )}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="rounded-lg border border-primary/30 bg-secondary p-4 text-sm">
            Reschedule request sent to {event?.client_name}. The session moves
            to the new slot once they accept.
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="rs-date">New date</Label>
                <Input
                  id="rs-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="rs-time">New time</Label>
                <Input
                  id="rs-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="rs-duration">Minutes</Label>
                <Input
                  id="rs-duration"
                  type="number"
                  min={15}
                  step={15}
                  value={duration}
                  onChange={(e) => setDurationInput(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="rs-message">Message (optional)</Label>
              <textarea
                id="rs-message"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. conflict with another session…"
                className="w-full resize-none rounded-lg border border-input bg-input/30 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={busy || !valid}
                className="bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {busy && <Loader2 data-icon="inline-start" className="animate-spin" />}
                Send request
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
