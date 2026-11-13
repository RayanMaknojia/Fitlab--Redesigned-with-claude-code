import { useCallback, useEffect, useMemo, useState } from "react"
import { Search, ShieldOff, ShieldCheck, Loader2 } from "lucide-react"

import { useAuth } from "@/context/AuthContext"
import type { AdminUser } from "@/types/admin"
import { blockUser, getAllUsers, unblockUser } from "@/lib/adminApi"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}

export default function AdminUsers() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setUsers(await getAllUsers())
    setLoading(false)
  }, [])

  useEffect(() => {
    const id = setTimeout(refresh, 0)
    return () => clearTimeout(id)
  }, [refresh])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    )
  }, [users, query])

  const toggleBlock = async (u: AdminUser) => {
    setBusyId(u._id)
    setError(null)
    try {
      if (u.blocked) await unblockUser(u._id)
      else await blockUser(u._id)
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
          Users<span className="text-primary">.</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every registered account. Block an account to prevent future logins and take down their listing.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email…"
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No users match your search.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((u) => {
            const isSelf = u._id === me?.id
            const isAdmin = u.role === "admin"
            return (
              <Card
                key={u._id}
                className="flex-row items-center gap-3 border-border bg-card shadow-[0_1px_2px_rgb(11_21_48/0.04)] px-4 py-3"
              >
                <Avatar className="size-9">
                  <AvatarFallback className="bg-muted text-xs font-semibold">
                    {initials(u.name)}
                  </AvatarFallback>
                </Avatar>
                <CardContent className="min-w-0 flex-1 p-0">
                  <div className="truncate text-sm font-medium">{u.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {u.email}
                  </div>
                </CardContent>
                <Badge variant="secondary" className="capitalize">
                  {u.role}
                </Badge>
                {u.blocked && (
                  <Badge variant="outline" className="text-destructive">
                    Blocked
                  </Badge>
                )}
                {isAdmin || isSelf ? (
                  <span className="w-24 shrink-0" />
                ) : (
                  <Button
                    variant={u.blocked ? "outline" : "destructive"}
                    size="sm"
                    disabled={busyId === u._id}
                    onClick={() => toggleBlock(u)}
                  >
                    {busyId === u._id ? (
                      <Loader2 data-icon="inline-start" className="animate-spin" />
                    ) : u.blocked ? (
                      <ShieldCheck data-icon="inline-start" />
                    ) : (
                      <ShieldOff data-icon="inline-start" />
                    )}
                    {u.blocked ? "Unblock" : "Block"}
                  </Button>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
