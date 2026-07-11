import { useNavigate } from "react-router-dom"
import { ArrowUpRight, Flame, MoreVertical, UserMinus } from "lucide-react"

import type { Client } from "@/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
  client: Client
  index: number
  onUnlink: (clientId: string) => void
}) {
  const navigate = useNavigate()
  const hue = AVATAR_HUES[index % AVATAR_HUES.length]
  const sessions = client.workout_sessions
  const lastSession = sessions[0]

  // tiny activity sparkline: exercises per session, most recent last
  const spark = sessions.slice(0, 8).reverse()
  const max = Math.max(1, ...spark.map((s) => s.exercises.length))

  const openClient = () => {
    // Client page view is owned by another teammate — we only route to it.
    navigate(`/clients/${client.client_id}`)
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
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Flame className="size-3.5 text-lime-400" />
            {sessions.length} session{sessions.length === 1 ? "" : "s"}
          </span>
          <span>
            {lastSession ? `Last: ${daysAgo(lastSession.session_date)}` : "No sessions yet"}
          </span>
        </div>
        <div className="mt-3 flex h-9 items-end gap-1">
          {spark.length > 0 ? (
            spark.map((s) => (
              <div
                key={s.session_id}
                title={new Date(s.session_date).toLocaleDateString()}
                className="flex-1 rounded-sm bg-lime-400/70 transition-colors group-hover:bg-lime-400"
                style={{ height: `${(s.exercises.length / max) * 100}%` }}
              />
            ))
          ) : (
            <div className="w-full self-center rounded-md border border-dashed border-border/70 py-2 text-center text-[11px] text-muted-foreground">
              activity will appear here
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="justify-between px-5">
        {client.goal && (
          <Badge
            variant="outline"
            className="border-lime-400/30 bg-lime-400/5 text-lime-300"
          >
            {client.goal}
          </Badge>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto text-muted-foreground group-hover:text-lime-300"
          onClick={openClient}
        >
          View profile <ArrowUpRight data-icon="inline-end" />
        </Button>
      </CardFooter>
    </Card>
  )
}
