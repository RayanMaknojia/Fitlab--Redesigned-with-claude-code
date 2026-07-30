// Trainer books a training session for a linked client
// (POST /api/clients/:clientId/schedules, backed by scheduleService).

import { useState } from "react"
import { CalendarPlus, Loader2 } from "lucide-react"

import type { ClientSummary } from "@/types"
import { addSchedule } from "@/lib/trainerApi"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AddScheduleDialog({
  clients,
  onScheduled,
}: {
  clients: ClientSummary[]
  onScheduled: () => void
}) {
  const [open, setOpen] = useState(false)
  const [clientId, setClientId] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [duration, setDuration] = useState("60")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const valid =
    clientId && date && time && Number(duration) > 0 && Number.isFinite(Number(duration))

  const reset = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setClientId("")
      setDate("")
      setTime("")
      setDuration("60")
      setError(null)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    setBusy(true)
    setError(null)
    try {
      await addSchedule(clientId, {
        start_time: new Date(`${date}T${time}`).toISOString(),
        duration_in_minutes: Number(duration),
      })
      onScheduled()
      reset(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger asChild>
        <Button
          className="bg-lime-400 font-semibold text-black hover:bg-lime-300"
          disabled={clients.length === 0}
          title={clients.length === 0 ? "Link a client first" : undefined}
        >
          <CalendarPlus data-icon="inline-start" /> Add session
        </Button>
      </DialogTrigger>
      <DialogContent className="dark border-border/60 text-foreground">
        <DialogHeader>
          <DialogTitle>Book a training session</DialogTitle>
          <DialogDescription>
            Schedule a session for one of your linked clients. It will appear
            on both your calendar and theirs.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="sched-client">Client</Label>
            <select
              id="sched-client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="" disabled>
                Select a client…
              </option>
              {clients.map((c) => (
                <option key={c.client_id} value={c.client_id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sched-date">Date</Label>
              <Input
                id="sched-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sched-time">Time</Label>
              <Input
                id="sched-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sched-duration">Minutes</Label>
              <Input
                id="sched-duration"
                type="number"
                min={15}
                step={15}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => reset(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={busy || !valid}
              className="bg-lime-400 font-semibold text-black hover:bg-lime-300"
            >
              {busy && <Loader2 data-icon="inline-start" className="animate-spin" />}
              Book session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
