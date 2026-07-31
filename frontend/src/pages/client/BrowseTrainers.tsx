import { useCallback, useEffect, useState } from "react"

import type { Listing } from "@/types/marketplace"
import { browseListings, connectToListing } from "@/lib/listingsApi"
import { getMyLinkRequests, getMyTrainer } from "@/lib/clientLinkApi"
import ListingCard from "@/components/marketplace/ListingCard"

export default function BrowseTrainers() {
  const [listings, setListings] = useState<Listing[]>([])
  const [linkedTrainerId, setLinkedTrainerId] = useState<string | null>(null)
  const [pendingTrainerIds, setPendingTrainerIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const [active, trainer, requests] = await Promise.all([
      browseListings(),
      getMyTrainer(),
      getMyLinkRequests(),
    ])
    setListings(active)
    setLinkedTrainerId(trainer?.trainer_id ?? null)
    setPendingTrainerIds(new Set(requests.map((r) => r.trainer_id)))
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
          Find a trainer<span className="text-lime-400">.</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse trainers advertising their services and send a connection request.
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
          No trainers are advertising right now.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard
              key={listing.listing_id}
              listing={listing}
              basePath="/client/browse"
              busy={busyId === listing.listing_id}
              status={
                linkedTrainerId === listing.user_id
                  ? "linked"
                  : pendingTrainerIds.has(listing.user_id)
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
