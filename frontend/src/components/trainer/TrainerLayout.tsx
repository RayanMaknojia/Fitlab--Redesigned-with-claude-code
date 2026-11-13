// Trainer app shell — FitLab light theme; layout lives in AppShell.
// Owned by: Jiachen Sun (trainer-client management).

import { useEffect, useState } from "react"
import { Outlet } from "react-router-dom"
import { Bell, Calendar, LayoutDashboard, Search, Settings, UserSquare2, Users } from "lucide-react"

import AppShell, { type NavItem } from "@/components/AppShell"
import AuthenticatedChatbot from "@/components/chatbot/AuthenticatedChatbot"
import { getMyNotifications } from "@/lib/notificationsApi"

const NAV: NavItem[] = [
  { to: "/trainer", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/trainer/clients", label: "Clients", icon: Users, end: false },
  { to: "/trainer/browse", label: "Find clients", icon: Search, end: false },
  { to: "/trainer/my-listing", label: "My listing", icon: UserSquare2, end: false },
  { to: "/trainer/notifications", label: "Notifications", icon: Bell, end: false },
  { to: "/trainer/schedule", label: "Schedule", icon: Calendar, end: false },
  { to: "/trainer/settings", label: "Settings", icon: Settings, end: false },
]

export default function TrainerLayout() {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const refresh = () =>
      getMyNotifications().then((n) => setUnreadCount(n.filter((x) => !x.read).length))
    const first = setTimeout(refresh, 0)
    const id = setInterval(refresh, 10_000)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [])

  return (
    <>
      <AppShell role="Trainer" nav={NAV} badges={{ "/trainer/notifications": unreadCount }}>
        <Outlet />
      </AppShell>
      <AuthenticatedChatbot />
    </>
  )
}
