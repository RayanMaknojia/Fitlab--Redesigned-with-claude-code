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
    <Card className="group gap-4 border-border bg-card shadow-[0_1px_2px_rgb(11_21_48/0.04)] py-5 transition-[transform,box-shadow,border-color] duration-200 [@media(hover:hover)]:hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_8px_40px_-12px] hover:shadow-primary/10">
      <CardHeader className="flex-row items-center gap-3 px-5">
        <Avatar className="size-11 bg-gradient-to-br from-primary/20 to-[#5b95ff]/15">
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-[#5b95ff]/15 text-sm font-bold text-primary">
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
          className="text-muted-foreground group-hover:text-primary"
          onClick={() => navigate(`${basePath}/${listing.listing_id}`)}
        >
          View profile <ArrowUpRight data-icon="inline-end" />
        </Button>

        {status === "linked" ? (
          <Badge variant="outline" className="gap-1 text-primary">
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
            className="bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
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
