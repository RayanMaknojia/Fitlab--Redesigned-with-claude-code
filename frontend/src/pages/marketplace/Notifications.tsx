import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Bell, BellOff, Check, CheckCheck, UserPlus, UserX } from "lucide-react"

import type { Notification } from "@/types/marketplace"
import { useAuth } from "@/context/AuthContext"
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notificationsApi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

function icon(type: Notification["type"]) {
  if (type === "link_request_received") return UserPlus
  if (type === "link_request_declined") return UserX
  return Check
}

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function Notifications() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setNotifications(await getMyNotifications())
    setLoading(false)
  }, [])

  useEffect(() => {
    const id = setTimeout(refresh, 0)
    return () => clearTimeout(id)
  }, [refresh])

  const open = async (n: Notification) => {
    if (!n.read) {
      await markNotificationRead(n.notification_id)
      refresh()
    }
    if (n.type === "link_request_received") {
      const base = user?.role === "trainer" ? "/trainer/requests" : "/client/requests"
      navigate(`${base}/${n.link_request_id}`)
    }
  }

  const markAllRead = async () => {
    await markAllNotificationsRead()
    refresh()
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Notifications<span className="text-lime-400">.</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connection requests and their responses.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck data-icon="inline-start" /> Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <BellOff className="size-8" />
          <p className="text-sm">No notifications yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => {
            const Icon = icon(n.type)
            return (
              <Card
                key={n.notification_id}
                onClick={() => open(n)}
                className="cursor-pointer flex-row items-center gap-3 border-border/60 bg-card/60 px-4 py-3 backdrop-blur transition-colors hover:border-lime-400/40"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-lime-400/15 text-lime-500">
                  <Icon className="size-4" />
                </div>
                <CardContent className="min-w-0 flex-1 p-0">
                  <p className={n.read ? "text-sm text-muted-foreground" : "text-sm font-medium"}>
                    {n.message}
                  </p>
                  <p className="text-xs text-muted-foreground">{timeAgo(n.created_at)}</p>
                </CardContent>
                {!n.read && (
                  <Badge className="bg-lime-400 text-black">
                    <Bell className="size-3" />
                  </Badge>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
