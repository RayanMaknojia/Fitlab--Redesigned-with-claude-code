import { useState } from "react"
import { Check, Clock, Loader2, X } from "lucide-react"

import type { LinkRequest } from "@/types"
import { acceptRequest, declineRequest } from "@/lib/trainerApi"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function RequestsPanel({
  requests,
  onChanged,
}: {
  requests: LinkRequest[]
  onChanged: () => void
}) {
  const [busyId, setBusyId] = useState<string | null>(null)

  if (requests.length === 0) return null

  const act = async (id: string, action: "accept" | "decline") => {
    setBusyId(id)
    try {
      if (action === "accept") await acceptRequest(id)
      else await declineRequest(id)
      onChanged()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Card className="gap-3 border-border/60 bg-card/60 py-5 backdrop-blur">
      <CardHeader className="flex-row items-center gap-2 px-5">
        <Clock className="size-4 text-lime-400" />
        <CardTitle className="text-sm">Pending requests</CardTitle>
        <Badge variant="secondary" className="ml-1">{requests.length}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 px-5">
        {requests.map((req) => (
          <div
            key={req.request_id}
            className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 p-3"
          >
            <Avatar className="size-8">
              <AvatarFallback className="bg-muted text-xs font-semibold">
                {req.client_name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{req.client_name}</div>
              <div className="truncate text-xs text-muted-foreground">
                {req.direction === "incoming"
                  ? "wants to train with you"
                  : "invitation sent — awaiting client"}
              </div>
            </div>
            {req.direction === "incoming" ? (
              <div className="flex gap-1.5">
                <Button
                  size="icon-sm"
                  aria-label={`Accept ${req.client_name}`}
                  className="bg-lime-400 text-black hover:bg-lime-300"
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
        ))}
      </CardContent>
    </Card>
  )
}
