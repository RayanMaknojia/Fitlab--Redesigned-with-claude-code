import { useState } from "react"
import { Check, Clock, Loader2, X } from "lucide-react"

import type { LinkRequest } from "@/types"
import { acceptRequest, declineRequest } from "@/lib/trainerApi"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Pending link requests on the trainer dashboard. A request initiated by
 * the client is incoming (accept/decline); one this trainer sent is
 * outgoing (waiting on the client).
 */
export default function RequestsPanel({
  requests,
  onChanged,
}: {
  requests: LinkRequest[]
  onChanged: () => void
}) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (requests.length === 0) return null

  const act = async (id: string, action: "accept" | "decline") => {
    setBusyId(id)
    setError(null)
    try {
      if (action === "accept") await acceptRequest(id)
      else await declineRequest(id)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
      onChanged() // the request may have been settled elsewhere — refresh
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Card className="gap-3 border-border bg-card shadow-[0_1px_2px_rgb(11_21_48/0.04)] py-5">
      <CardHeader className="flex-row items-center gap-2 px-5">
        <Clock className="size-4 text-primary" />
        <CardTitle className="text-sm">Pending requests</CardTitle>
        <Badge variant="secondary" className="ml-1">{requests.length}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 px-5">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {requests.map((req) => {
          const incoming = req.requested_by === "client"
          return (
            <div
              key={req.request_id}
              className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3"
            >
              <Avatar className="size-8">
                <AvatarFallback className="bg-muted text-xs font-semibold">
                  {req.client_name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{req.client_name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {incoming
                    ? "wants to train with you"
                    : "invitation sent — awaiting client"}
                </div>
              </div>
              {incoming ? (
                <div className="flex gap-1.5">
                  <Button
                    size="icon-sm"
                    aria-label={`Accept ${req.client_name}`}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={busyId === req.request_id}
                    onClick={() => act(req.request_id, "accept")}
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
                    aria-label={`Decline ${req.client_name}`}
                    disabled={busyId === req.request_id}
                    onClick={() => act(req.request_id, "decline")}
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
      </CardContent>
    </Card>
  )
}
