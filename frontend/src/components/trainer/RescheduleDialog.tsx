// Reschedule request form. Submitting stores a pending request in the mock
// API — the client-approval / backend flow is intentionally left for later.

import { useState } from "react"
import { CalendarClock, Loader2 } from "lucide-react"

import type { ScheduleEvent } from "@/types"
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

function formatSession(event: ScheduleEvent) {
  const d = new Date(event.start_time)
  return `${d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })} · ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · ${
    event.duration
  } min`
}

export default function RescheduleDialog({
  event,
  onClose,
}: {
  event: ScheduleEvent | null
  onClose: () => void
}) {
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const close = () => {
    setDate("")
    setTime("")
    setReason("")
    setSent(false)
    onClose()
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!event) return
    setBusy(true)
    try {
      const proposed =
        date && time ? new Date(`${date}T${time}`).toISOString() : null
      await requestReschedule({
        client_id: event.client_id,
        original_start: event.start_time,
        proposed_start: proposed,
        reason: reason.trim(),
      })
      setSent(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={event !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="dark border-border/60 text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="size-5 text-lime-400" />
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
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="rounded-lg border border-lime-400/30 bg-lime-400/10 p-4 text-sm">
            Reschedule request sent to {event?.client_name}. They'll be
            notified and can accept a new time.
            <span className="mt-1 block text-xs text-muted-foreground">
              (Backend flow coming later — the request is stored as pending.)
            </span>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="rs-date">Proposed date</Label>
                <Input
                  id="rs-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="rs-time">Proposed time</Label>
                <Input
                  id="rs-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>
            <p className="-mt-2 text-xs text-muted-foreground">
              Leave blank to let the client pick a time.
            </p>

            <div className="flex flex-col gap-2">
              <Label htmlFor="rs-reason">Reason (optional)</Label>
              <textarea
                id="rs-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. conflict with another session…"
                className="w-full resize-none rounded-lg border border-input bg-input/30 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={busy}
                className="bg-lime-400 font-semibold text-black hover:bg-lime-300"
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
