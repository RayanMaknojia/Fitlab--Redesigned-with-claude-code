// Trainer dashboard — overview of linked clients and connection requests.
// Owned by: Jiachen Sun (trainer-client management).

import { useCallback, useEffect, useState } from "react"
import { Dumbbell, Users, Zap } from "lucide-react"

import type { ClientSummary, LinkRequest } from "@/types"
import { getClients, getRequests, unlinkClient } from "@/lib/trainerApi"
import ClientCard from "@/components/trainer/ClientCard"
import LinkClientDialog from "@/components/trainer/LinkClientDialog"
import RequestsPanel from "@/components/trainer/RequestsPanel"
import { Card, CardContent } from "@/components/ui/card"

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users
  label: string
  value: string | number
}) {
  return (
    <Card className="flex-1 gap-0 border-border/60 bg-card/60 py-4 backdrop-blur">
      <CardContent className="flex items-center gap-3 px-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-lime-400/10 text-lime-300">
          <Icon className="size-5" />
        </div>
        <div>
          <div className="text-2xl leading-none font-bold tracking-tight">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border/70 px-6 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-lime-400/10">
        <Users className="size-8 text-lime-400" />
      </div>
      <h3 className="mt-5 text-lg font-semibold">No clients yet</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Link your first client to start tracking their workouts, progress and
        schedule — all in one place.
      </p>
      <div className="mt-6">
        <LinkClientDialog onRequestSent={() => {}} />
      </div>
    </div>
  )
}

export default function TrainerDashboard() {
  const [clients, setClients] = useState<ClientSummary[]>([])
  const [requests, setRequests] = useState<LinkRequest[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const [c, r] = await Promise.all([getClients(), getRequests()])
    setClients(c)
    setRequests(r)
    setLoading(false)
  }, [])

  useEffect(() => {
    // Light polling so a client accepting/sending a request shows up
    // without a manual refresh (no websockets in this project).
    const first = setTimeout(refresh, 0)
    const id = setInterval(refresh, 10_000)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [refresh])

  const handleUnlink = async (clientId: string) => {
    await unlinkClient(clientId)
    refresh()
  }

  const totalSessions = clients.reduce((sum, c) => sum + c.total_sessions, 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Your Client<span className="text-lime-400">s</span>
          </h1>
        </div>
        {clients.length > 0 && <LinkClientDialog onRequestSent={refresh} />}
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <StatTile icon={Users} label="Active clients" value={clients.length} />
        <StatTile icon={Zap} label="Pending requests" value={requests.length} />
        <StatTile icon={Dumbbell} label="Client sessions logged" value={totalSessions} />
      </div>

      <RequestsPanel requests={requests} onChanged={refresh} />

      {/* Client grid / empty state */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-52 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {clients.map((client, i) => (
            <ClientCard
              key={client.client_id}
              client={client}
              index={i}
              onUnlink={handleUnlink}
            />
          ))}
        </div>
      )}
    </div>
  )
}
