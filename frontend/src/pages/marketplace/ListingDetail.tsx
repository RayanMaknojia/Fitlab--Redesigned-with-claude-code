import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Check, Link2, Loader2 } from "lucide-react"

import type { Listing } from "@/types/marketplace"
import { useAuth } from "@/context/AuthContext"
import { connectToListing, getListing } from "@/lib/listingsApi"
import { getMyLinkRequests, getMyTrainer } from "@/lib/clientLinkApi"
import { getClients, getRequests } from "@/lib/trainerApi"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}

export default function ListingDetail() {
  const { listingId } = useParams<{ listingId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [listing, setListing] = useState<Listing | null>(null)
  const [status, setStatus] = useState<"none" | "pending" | "linked">("none")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const basePath = user?.role === "trainer" ? "/trainer/browse" : "/client/browse"

  const refresh = useCallback(async () => {
    if (!listingId) return
    const found = await getListing(listingId)
    setListing(found)

    if (user?.role === "client") {
      const [trainer, requests] = await Promise.all([getMyTrainer(), getMyLinkRequests()])
      setStatus(
        trainer?.trainer_id === found.user_id
          ? "linked"
          : requests.some((r) => r.trainer_id === found.user_id)
            ? "pending"
            : "none",
      )
    } else if (user?.role === "trainer") {
      const [clients, requests] = await Promise.all([getClients(), getRequests()])
      setStatus(
        clients.some((c) => c.client_id === found.user_id)
          ? "linked"
          : requests.some((r) => r.client_id === found.user_id)
            ? "pending"
            : "none",
      )
    }

    setLoading(false)
  }, [listingId, user?.role])

  useEffect(() => {
    const id = setTimeout(refresh, 0)
    return () => clearTimeout(id)
  }, [refresh])

  const connect = async () => {
    if (!listing) return
    setBusy(true)
    setError(null)
    try {
      await connectToListing(listing.listing_id)
      setNotice(`Request sent to ${listing.name}.`)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted/40" />
  }

  if (!listing) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        This listing no longer exists.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit text-muted-foreground"
        onClick={() => navigate(basePath)}
      >
        <ArrowLeft data-icon="inline-start" /> Back
      </Button>

      <Card className="border-border/60 bg-card/60 py-5 backdrop-blur">
        <CardHeader className="flex-row items-center gap-4 px-5">
          <Avatar className="size-14 bg-gradient-to-br from-lime-400/30 to-emerald-500/20">
            <AvatarFallback className="bg-gradient-to-br from-lime-400/30 to-emerald-500/20 text-lg font-bold text-lime-300">
              {initials(listing.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-semibold">{listing.name}</div>
            <div className="text-sm text-muted-foreground">{listing.headline}</div>
          </div>
          {status === "linked" ? (
            <Badge variant="outline" className="gap-1 text-lime-500">
              <Check className="size-3" /> Linked
            </Badge>
          ) : status === "pending" ? (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> Pending
            </Badge>
          ) : (
            <Button
              disabled={busy}
              className="bg-lime-400 font-semibold text-black hover:bg-lime-300"
              onClick={connect}
            >
              {busy ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <Link2 data-icon="inline-start" />
              )}
              Connect
            </Button>
          )}
        </CardHeader>

        <CardContent className="px-5">
          <p className="whitespace-pre-wrap text-sm text-foreground">{listing.bio}</p>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          {notice && !error && <p className="mt-3 text-sm text-lime-600">{notice}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
