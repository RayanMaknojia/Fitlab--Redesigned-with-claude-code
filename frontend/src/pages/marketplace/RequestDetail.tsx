import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Check, Loader2, X } from "lucide-react"

import type { LinkRequest } from "@/types"
import type { Listing } from "@/types/marketplace"
import { useAuth } from "@/context/AuthContext"
import { getListingByUser } from "@/lib/listingsApi"
import {
  acceptLinkRequest,
  declineLinkRequest,
  getMyLinkRequests,
} from "@/lib/clientLinkApi"
import { acceptRequest, declineRequest, getRequests } from "@/lib/trainerApi"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}

export default function RequestDetail() {
  const { requestId } = useParams<{ requestId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [request, setRequest] = useState<LinkRequest | null>(null)
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const backPath = user?.role === "trainer" ? "/trainer" : "/client"

  const refresh = useCallback(async () => {
    if (!requestId) return

    const requests =
      user?.role === "trainer" ? await getRequests() : await getMyLinkRequests()
    const found = requests.find((r) => r.request_id === requestId) ?? null
    setRequest(found)

    if (found) {
      const counterpartId =
        user?.role === "trainer" ? found.client_id : found.trainer_id
      try {
        setListing(await getListingByUser(counterpartId))
      } catch {
        setListing(null)
      }
    }

    setLoading(false)
  }, [requestId, user?.role])

  useEffect(() => {
    const id = setTimeout(refresh, 0)
    return () => clearTimeout(id)
  }, [refresh])

  const respond = async (accept: boolean) => {
    if (!requestId) return
    setBusy(true)
    setError(null)
    try {
      if (user?.role === "trainer") {
        await (accept ? acceptRequest : declineRequest)(requestId)
      } else {
        await (accept ? acceptLinkRequest : declineLinkRequest)(requestId)
      }
      navigate(backPath)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted/40" />
  }

  if (!request) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        This request is no longer pending.
      </p>
    )
  }

  const counterpartName =
    user?.role === "trainer" ? request.client_name : request.trainer_name
  const incoming =
    (user?.role === "trainer" && request.requested_by === "client") ||
    (user?.role === "client" && request.requested_by === "trainer")

  return (
    <div className="flex flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit text-muted-foreground"
        onClick={() => navigate(backPath)}
      >
        <ArrowLeft data-icon="inline-start" /> Back
      </Button>

      <Card className="border-border bg-card shadow-[0_1px_2px_rgb(11_21_48/0.04)] py-5">
        <CardHeader className="flex-row items-center gap-4 px-5">
          <Avatar className="size-14 bg-gradient-to-br from-primary/20 to-[#5b95ff]/15">
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-[#5b95ff]/15 text-lg font-bold text-primary">
              {initials(counterpartName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-semibold">{counterpartName}</div>
            <div className="text-sm text-muted-foreground">
              {listing?.headline ?? "Hasn't posted a listing"}
            </div>
          </div>
          {!incoming && (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> Pending
            </Badge>
          )}
        </CardHeader>

        <CardContent className="flex flex-col gap-4 px-5">
          <p className="whitespace-pre-wrap text-sm text-foreground">
            {listing?.bio ?? "No bio available."}
          </p>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {incoming && (
            <div className="flex gap-2">
              <Button
                disabled={busy}
                className="bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                onClick={() => respond(true)}
              >
                {busy ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <Check data-icon="inline-start" />
                )}
                Accept
              </Button>
              <Button variant="outline" disabled={busy} onClick={() => respond(false)}>
                <X data-icon="inline-start" /> Decline
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
