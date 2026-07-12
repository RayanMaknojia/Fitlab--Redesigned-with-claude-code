import { useState } from "react"
import { Loader2, UserPlus } from "lucide-react"

import { sendLinkRequest, DEMO_EMAILS } from "@/lib/trainerApi"
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

export default function LinkClientDialog({
  onRequestSent,
  trigger,
}: {
  onRequestSent: () => void
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setBusy(true)
    setError(null)
    try {
      const req = await sendLinkRequest(email)
      setSent(req.client_name)
      setEmail("")
      onRequestSent()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setBusy(false)
    }
  }

  const reset = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setError(null)
      setSent(null)
      setEmail("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="bg-lime-400 font-semibold text-black hover:bg-lime-300">
            <UserPlus data-icon="inline-start" /> Link a client
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="dark border-border/60 text-foreground">
        <DialogHeader>
          <DialogTitle>Link a client</DialogTitle>
          <DialogDescription>
            Send a connection request to a registered FitLab client. They'll
            appear on your dashboard once they accept.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="rounded-lg border border-lime-400/30 bg-lime-400/10 p-4 text-sm">
            Request sent to <span className="font-semibold">{sent}</span>. It
            will show under pending requests until they accept.
            <span className="mt-1 block text-xs text-muted-foreground">
              (Demo: the client auto-accepts after a few seconds.)
            </span>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="client-email">Client email</Label>
              <Input
                id="client-email"
                type="email"
                placeholder="client@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Demo accounts:</span>
              {DEMO_EMAILS.map((demo) => (
                <button
                  key={demo}
                  type="button"
                  onClick={() => setEmail(demo)}
                  className="rounded-full border border-border/70 px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-lime-400/50 hover:text-lime-300"
                >
                  {demo}
                </button>
              ))}
            </div>

            <DialogFooter>
              <Button
                type="submit"
                disabled={busy || !email.trim()}
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
