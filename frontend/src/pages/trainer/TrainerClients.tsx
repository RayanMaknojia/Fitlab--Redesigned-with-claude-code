// Full client roster with search.
// Owned by: Jiachen Sun (trainer-client management).

import { useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"

import type { Client } from "@/types"
import { getClients, unlinkClient } from "@/lib/trainerApi"
import ClientCard from "@/components/trainer/ClientCard"
import LinkClientDialog from "@/components/trainer/LinkClientDialog"
import { Input } from "@/components/ui/input"

export default function TrainerClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [query, setQuery] = useState("")

  const refresh = () => getClients().then(setClients)

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 3000)
    return () => clearInterval(id)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.goal?.toLowerCase().includes(q)
    )
  }, [clients, query])

  const handleUnlink = async (clientId: string) => {
    await unlinkClient(clientId)
    refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Client<span className="text-lime-400">s</span>
        </h1>
        <LinkClientDialog onRequestSent={refresh} />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email or goal…"
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {clients.length === 0
            ? "No clients linked yet — send a request to get started."
            : "No clients match your search."}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((client, i) => (
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
