// My Trainer — the client's half of the trainer↔client linking flow.
// Shows the linked trainer (with unlink), pending link requests
// (incoming from trainers → accept/decline; outgoing → waiting), and a
// form to send a request to a trainer by email. The send form is
// disabled while linked: a client can only have one trainer at a time.
// Owned by: Jiachen Sun (trainer-client management).

import { useCallback, useEffect, useState } from "react"
import { Check, Loader2, Send, UserMinus, UserRound, X } from "lucide-react"

import type { LinkedTrainer, LinkRequest } from "@/types"
import {
  acceptLinkRequest,
  declineLinkRequest,
  getMyLinkRequests,
  getMyTrainer,
  sendLinkRequestToTrainer,
  unlinkMyTrainer,
} from "@/lib/clientLinkApi"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}

export default function MyTrainerCard() {
  const [trainer, setTrainer] = useState<LinkedTrainer | null>(null)
  const [requests, setRequests] = useState<LinkRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const [t, r] = await Promise.all([getMyTrainer(), getMyLinkRequests()])
    setTrainer(t)
    setRequests(r)
    setLoading(false)
  }, [])

  useEffect(() => {
    // Light polling so trainer-initiated requests show up (no websockets).
    const first = setTimeout(refresh, 0)
    const id = setInterval(refresh, 10_000)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [refresh])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const req = await sendLinkRequestToTrainer(email)
      setNotice(`Request sent to ${req.trainer_name}.`)
      setEmail("")
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setBusy(false)
    }
  }

  const respond = async (id: string, action: "accept" | "decline") => {
    setBusyId(id)
    setError(null)
    try {
      if (action === "accept") await acceptLinkRequest(id)
      else await declineLinkRequest(id)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
      refresh()
    } finally {
      setBusyId(null)
    }
  }

  const unlink = async () => {
    setBusy(true)
    setError(null)
    try {
      await unlinkMyTrainer()
      setNotice("You are no longer linked with a trainer.")
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="gap-4 rounded-xl border border-border bg-card py-5 shadow-[0_1px_2px_rgb(11_21_48/0.04)] ring-0">
      <CardHeader className="flex-row items-center gap-2 px-5">
        <UserRound className="size-4 text-primary" />
        <CardTitle className="text-base font-semibold">My trainer</CardTitle>
        {requests.length > 0 && (
          <Badge variant="secondary" className="ml-1">
            {requests.length} pending
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-3 px-5">
        {loading ? (
          <div className="h-16 animate-pulse rounded-lg bg-muted" />
        ) : trainer ? (
          <div className="flex items-center gap-3 rounded-lg bg-muted/60 p-3">
            <Avatar className="size-9">
              <AvatarFallback className="bg-secondary text-xs font-bold text-secondary-foreground">
                {initials(trainer.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{trainer.name}</div>
              <div className="truncate text-xs text-muted-foreground">
                {trainer.email}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={unlink}
              title="Unlink from this trainer"
            >
              <UserMinus data-icon="inline-start" /> Unlink
            </Button>
          </div>
        ) : (
          <>
            {requests.map((req) => {
              const incoming = req.requested_by === "trainer"
              return (
                <div
                  key={req.request_id}
                  className="flex items-center gap-3 rounded-lg bg-muted/60 p-3"
                >
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-muted text-xs font-semibold">
                      {initials(req.trainer_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {req.trainer_name}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {incoming
                        ? "wants to be your trainer"
                        : "request sent — awaiting trainer"}
                    </div>
                  </div>
                  {incoming ? (
                    <div className="flex gap-1.5">
                      <Button
                        size="icon-sm"
                        aria-label={`Accept ${req.trainer_name}`}
                        className="press"
                        disabled={busyId === req.request_id}
                        onClick={() => respond(req.request_id, "accept")}
                      >
                        {busyId === req.request_id ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Check />
                        )}
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="outline"
                        aria-label={`Decline ${req.trainer_name}`}
                        disabled={busyId === req.request_id}
                        onClick={() => respond(req.request_id, "decline")}
                      >
                        <X />
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-muted-foreground">
                      <Loader2 className="size-3 animate-spin" /> pending
                    </Badge>
                  )}
                </div>
              )
            })}

            <form onSubmit={send} className="flex gap-2">
              <Input
                type="email"
                placeholder="trainer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Trainer email"
              />
              <Button
                type="submit"
                disabled={busy || !email.trim()}
                className="press shrink-0 font-semibold"
              >
                {busy ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <Send data-icon="inline-start" />
                )}
                Link
              </Button>
            </form>
            <p className="-mt-1 text-xs text-muted-foreground">
              Enter your trainer's FitLab email to send them a link request.
            </p>
          </>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
        {notice && !error && (
          <p className="text-sm text-primary">{notice}</p>
        )}
      </CardContent>
    </Card>
  )
}
