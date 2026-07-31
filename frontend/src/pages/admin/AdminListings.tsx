import { useCallback, useEffect, useState } from "react"
import { Loader2, Trash2, X } from "lucide-react"

import type { AdminListing } from "@/types/admin"
import { getAllListings, removeListing } from "@/lib/adminApi"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}

function ListingRow({
  listing,
  onRemoved,
}: {
  listing: AdminListing
  onRemoved: () => void
}) {
  const [removing, setRemoving] = useState(false)
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirmRemove = async () => {
    setBusy(true)
    setError(null)
    try {
      await removeListing(listing.listing_id, reason.trim() || undefined)
      onRemoved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
      setBusy(false)
    }
  }

  return (
    <Card className="border-border/60 bg-card/60 py-4 backdrop-blur">
      <CardHeader className="flex-row items-center gap-3 px-4">
        <Avatar className="size-10">
          <AvatarFallback className="bg-muted text-xs font-semibold">
            {initials(listing.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{listing.name}</div>
          <div className="truncate text-xs text-muted-foreground">
            {listing.headline}
          </div>
        </div>
        <Badge variant="secondary" className="capitalize">
          {listing.role}
        </Badge>
        {listing.status === "removed" ? (
          <Badge variant="outline" className="text-destructive">
            Removed
          </Badge>
        ) : removing ? (
          <div className="flex items-center gap-1.5">
            <Input
              placeholder="Reason (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-8 w-40"
              autoFocus
            />
            <Button
              size="sm"
              variant="destructive"
              disabled={busy}
              onClick={confirmRemove}
            >
              {busy ? <Loader2 className="animate-spin" /> : "Confirm"}
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              disabled={busy}
              onClick={() => setRemoving(false)}
            >
              <X />
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="destructive" onClick={() => setRemoving(true)}>
            <Trash2 data-icon="inline-start" /> Remove
          </Button>
        )}
      </CardHeader>
      {(listing.status === "removed" && listing.removed_reason) || error ? (
        <CardContent className="px-4 pt-0">
          {error && <p className="text-xs text-destructive">{error}</p>}
          {listing.status === "removed" && listing.removed_reason && (
            <p className="text-xs text-muted-foreground">
              Reason: {listing.removed_reason}
            </p>
          )}
        </CardContent>
      ) : null}
    </Card>
  )
}

export default function AdminListings() {
  const [listings, setListings] = useState<AdminListing[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setListings(await getAllListings())
    setLoading(false)
  }, [])

  useEffect(() => {
    const id = setTimeout(refresh, 0)
    return () => clearTimeout(id)
  }, [refresh])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Listings<span className="text-lime-400">.</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every marketplace listing, active and removed.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No listings have been posted yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {listings.map((listing) => (
            <ListingRow key={listing.listing_id} listing={listing} onRemoved={refresh} />
          ))}
        </div>
      )}
    </div>
  )
}
