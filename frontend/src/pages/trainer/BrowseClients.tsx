import { useCallback, useEffect, useState } from "react"

import type { Listing } from "@/types/marketplace"
import { browseListings, connectToListing } from "@/lib/listingsApi"
import { getClients, getRequests } from "@/lib/trainerApi"
import ListingCard from "@/components/marketplace/ListingCard"

export default function BrowseClients() {
  const [listings, setListings] = useState<Listing[]>([])
  const [linkedClientIds, setLinkedClientIds] = useState<Set<string>>(new Set())
  const [pendingClientIds, setPendingClientIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const [active, clients, requests] = await Promise.all([
      browseListings(),
      getClients(),
      getRequests(),
    ])
    setListings(active)
    setLinkedClientIds(new Set(clients.map((c) => c.client_id)))
    setPendingClientIds(new Set(requests.map((r) => r.client_id)))
    setLoading(false)
  }, [])

  useEffect(() => {
    const id = setTimeout(refresh, 0)
    return () => clearTimeout(id)
  }, [refresh])

  const connect = async (listing: Listing) => {
    setBusyId(listing.listing_id)
    setError(null)
    try {
      await connectToListing(listing.listing_id)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Find a client<span className="text-primary">.</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse clients advertising that they're seeking a trainer and send a connection request.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No clients are advertising right now.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard
              key={listing.listing_id}
              listing={listing}
              basePath="/trainer/browse"
              busy={busyId === listing.listing_id}
              status={
                linkedClientIds.has(listing.user_id)
                  ? "linked"
                  : pendingClientIds.has(listing.user_id)
                    ? "pending"
                    : "none"
              }
              onConnect={() => connect(listing)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
