// Admin app shell — FitLab light theme; layout lives in AppShell.

import { Outlet } from "react-router-dom"
import { ScrollText, Users } from "lucide-react"

import AppShell, { type NavItem } from "@/components/AppShell"

const NAV: NavItem[] = [
  { to: "/admin", label: "Users", icon: Users, end: true },
  { to: "/admin/listings", label: "Listings", icon: ScrollText, end: false },
]

export default function AdminLayout() {
  return (
    <AppShell role="Admin" nav={NAV}>
      <Outlet />
    </AppShell>
  )
}
