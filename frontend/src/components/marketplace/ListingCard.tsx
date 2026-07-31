import { useNavigate } from "react-router-dom"
import { ArrowUpRight, Check, Link2, Loader2 } from "lucide-react"

import type { Listing } from "@/types/marketplace"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}

export default function ListingCard({
  listing,
  status,
  busy,
  onConnect,
  basePath,
}: {
  listing: Listing
  status: "none" | "pending" | "linked"
  busy: boolean
  onConnect: () => void
  basePath: string
}) {
  const navigate = useNavigate()

  return (
    <Card className="group gap-4 border-border/60 bg-card/60 py-5 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-lime-400/40 hover:shadow-[0_8px_40px_-12px] hover:shadow-lime-400/20">
      <CardHeader className="flex-row items-center gap-3 px-5">
        <Avatar className="size-11 bg-gradient-to-br from-lime-400/30 to-emerald-500/20">
          <AvatarFallback className="bg-gradient-to-br from-lime-400/30 to-emerald-500/20 text-sm font-bold text-lime-300">
            {initials(listing.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{listing.name}</div>
          <div className="truncate text-xs text-muted-foreground">
            {listing.headline}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5">
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {listing.bio}
        </p>
      </CardContent>

      <CardFooter className="justify-between px-5">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground group-hover:text-lime-300"
          onClick={() => navigate(`${basePath}/${listing.listing_id}`)}
        >
          View profile <ArrowUpRight data-icon="inline-end" />
        </Button>

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
            size="sm"
            disabled={busy}
            className="bg-lime-400 font-semibold text-black hover:bg-lime-300"
            onClick={onConnect}
          >
            {busy ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <Link2 data-icon="inline-start" />
            )}
            Connect
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
