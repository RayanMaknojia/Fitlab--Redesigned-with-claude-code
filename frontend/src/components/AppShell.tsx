// Shared app shell for the client, trainer and admin areas.
//
// - md and up: sidebar pinned to the left edge, content fills the rest of the
//   screen (capped at a readable max width so huge monitors stay usable).
// - below md: a sticky top bar with a menu button that opens the same
//   navigation as a slide-in drawer.

import { useEffect, useState, type ReactNode } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { LogOut, Menu, X, type LucideIcon } from "lucide-react"

import { FitLabLogo } from "@/components/AuthShell"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  end: boolean
  soon?: boolean
}

function Brand({ role }: { role: string }) {
  return (
    <div className="flex items-center gap-2">
      <FitLabLogo />
      <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-semibold text-secondary-foreground">
        {role}
      </span>
    </div>
  )
}

function NavList({
  nav,
  badges,
  onNavigate,
}: {
  nav: NavItem[]
  badges?: Record<string, number>
  onNavigate?: () => void
}) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {nav.map(({ to, label, icon: Icon, end, soon }) => {
        const count = badges?.[to] ?? 0
        return (
          <NavLink
            key={to}
            to={soon ? "#" : to}
            end={end}
            onClick={(e) => {
              if (soon) e.preventDefault()
              else onNavigate?.()
            }}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                isActive &&
                  !soon &&
                  "bg-secondary text-secondary-foreground hover:bg-secondary hover:text-secondary-foreground",
                soon && "cursor-default opacity-50 hover:bg-transparent hover:text-muted-foreground",
              )
            }
          >
            <Icon className="size-4" />
            {label}
            {soon && (
              <Badge variant="secondary" className="ml-auto text-[10px]">
                soon
              </Badge>
            )}
            {count > 0 && (
              <Badge className="ml-auto bg-primary text-[10px] text-primary-foreground">{count}</Badge>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}

function UserCard() {
  const { user, logout } = useAuth()
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-3">
      <Avatar className="size-9 border border-border">
        <AvatarFallback className="bg-secondary text-xs font-bold text-secondary-foreground">
          {user?.name
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{user?.name}</div>
        <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
      </div>
      <button
        onClick={logout}
        className="press rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        title="Log out"
        aria-label="Log out"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  )
}

export default function AppShell({
  role,
  nav,
  badges,
  children,
}: {
  role: string
  nav: NavItem[]
  /** Optional count badges keyed by nav path, e.g. unread notifications. */
  badges?: Record<string, number>
  children: ReactNode
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar, pinned to the left edge */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-8 border-r border-border bg-card px-4 py-6 md:flex">
        <div className="px-2">
          <Brand role={role} />
        </div>
        <div className="-mx-1 flex-1 overflow-y-auto px-1">
          <NavList nav={nav} badges={badges} />
        </div>
        <UserCard />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/90 px-4 backdrop-blur-md md:hidden">
          <Brand role={role} />
          <button
            onClick={() => setMenuOpen(true)}
            className="press rounded-lg p-2 text-foreground hover:bg-muted"
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <Menu className="size-5" />
          </button>
        </header>

        <main className="w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>

      {/* Mobile navigation drawer */}
      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent
          showCloseButton={false}
          className="top-0 left-0 flex h-dvh max-w-[18rem] translate-x-0 translate-y-0 flex-col gap-6 rounded-none border-0 border-r p-4 data-[state=closed]:slide-out-to-left data-[state=closed]:zoom-out-100 data-[state=open]:slide-in-from-left data-[state=open]:zoom-in-100 sm:max-w-[18rem]"
        >
          <div className="flex items-center justify-between px-2 pt-2">
            <DialogTitle asChild>
              <div>
                <Brand role={role} />
              </div>
            </DialogTitle>
            <button
              onClick={() => setMenuOpen(false)}
              className="press rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <NavList nav={nav} badges={badges} onNavigate={() => setMenuOpen(false)} />
          </div>
          <UserCard />
        </DialogContent>
      </Dialog>
    </div>
  )
}
