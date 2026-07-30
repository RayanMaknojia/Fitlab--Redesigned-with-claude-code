import { useNavigate } from "react-router-dom"
import { ArrowUpRight, CalendarCheck, Flame, MoreVertical, UserMinus } from "lucide-react"

import type { ClientSummary } from "@/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const AVATAR_HUES = [
  "from-lime-400/30 to-emerald-500/20 text-lime-300",
  "from-cyan-400/30 to-blue-500/20 text-cyan-300",
  "from-fuchsia-400/30 to-purple-500/20 text-fuchsia-300",
  "from-amber-400/30 to-orange-500/20 text-amber-300",
  "from-rose-400/30 to-red-500/20 text-rose-300",
]

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}

function daysAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400_000)
  if (d <= 0) return "today"
  if (d === 1) return "yesterday"
  return `${d}d ago`
}

export default function ClientCard({
  client,
  index,
  onUnlink,
}: {
  client: ClientSummary
  index: number
  onUnlink: (clientId: string) => void
}) {
  const navigate = useNavigate()
  const hue = AVATAR_HUES[index % AVATAR_HUES.length]

  const openClient = () => {
    // Trainer-side synced view: history, progress, and editing.
    navigate(`/trainer/clients/${client.client_id}`)
  }

  return (
    <Card className="group gap-4 border-border/60 bg-card/60 py-5 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-lime-400/40 hover:shadow-[0_8px_40px_-12px] hover:shadow-lime-400/20">
      <CardHeader className="flex-row items-center gap-3 px-5">
        <Avatar className={`size-11 bg-gradient-to-br ${hue.split(" text-")[0]}`}>
          <AvatarFallback
            className={`bg-gradient-to-br text-sm font-bold ${hue}`}
          >
            {initials(client.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{client.name}</div>
          <div className="truncate text-xs text-muted-foreground">
            {client.email}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Client actions">
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="dark">
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => onUnlink(client.client_id)}
            >
              <UserMinus /> Unlink client
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="px-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-xs">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Flame className="size-3.5 text-lime-400" /> Workout sessions
            </span>
            <span className="font-semibold text-foreground">
              {client.total_sessions}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-xs">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <CalendarCheck className="size-3.5 text-lime-400" /> Last session
            </span>
            <span className="font-semibold text-foreground">
              {client.last_session_date
                ? daysAgo(client.last_session_date)
                : "none yet"}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="justify-end px-5">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground group-hover:text-lime-300"
          onClick={openClient}
        >
          View profile <ArrowUpRight data-icon="inline-end" />
        </Button>
      </CardFooter>
    </Card>
  )
}
