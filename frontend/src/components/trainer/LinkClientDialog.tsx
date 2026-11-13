import { useState } from "react"
import { Loader2, UserPlus } from "lucide-react"

import { sendLinkRequest } from "@/lib/trainerApi"
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
          <Button className="bg-primary font-semibold text-primary-foreground hover:bg-primary/90">
            <UserPlus data-icon="inline-start" /> Link a client
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="border-border text-foreground">
        <DialogHeader>
          <DialogTitle>Link a client</DialogTitle>
          <DialogDescription>
            Send a connection request to a registered FitLab client. They'll
            appear on your dashboard once they accept.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="rounded-lg border border-primary/30 bg-secondary p-4 text-sm">
            Request sent to <span className="font-semibold">{sent}</span>. It
            will show under pending requests until they accept.
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

            <DialogFooter>
              <Button
                type="submit"
                disabled={busy || !email.trim()}
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
