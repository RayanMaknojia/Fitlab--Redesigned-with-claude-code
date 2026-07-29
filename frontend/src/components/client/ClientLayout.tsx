// Client app shell — same dark athletic theme as TrainerLayout, scoped with
// the `dark` class so other pages (login, trainer view) keep their own styling.
// Owned by: [your name] (progress dashboard / client view).

import { NavLink, Outlet } from "react-router-dom";
import {
  Dumbbell,
  LayoutDashboard,
  LineChart,
  Calendar,
  Settings,
  LogOut,
  ClipboardClock,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import AuthenticatedChatbot from "@/components/chatbot/AuthenticatedChatbot";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { to: "/client", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/client/progress", label: "Progress", icon: LineChart, end: false },
  {
    to: "/client/exercise-templates",
    label: "Exercise Templates",
    icon: ClipboardClock,
    end: false,
  },
  {
    to: "/client/schedule",
    label: "Schedule",
    icon: Calendar,
    end: false,
    soon: true,
  },
  {
    to: "/client/settings",
    label: "Settings",
    icon: Settings,
    end: false,
    soon: true,
  },
];

export default function ClientLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_60%_40%_at_15%_-10%,oklch(0.85_0.21_128/0.13),transparent),radial-gradient(ellipse_50%_35%_at_90%_110%,oklch(0.7_0.15_200/0.1),transparent)]"
      />

      <div className="relative mx-auto flex min-h-screen max-w-7xl">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border/60 px-4 py-6 md:flex">
          <div className="flex items-center gap-2.5 px-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-lime-400 text-black shadow-[0_0_24px_-4px] shadow-lime-400/60">
              <Dumbbell className="size-5" />
            </div>
            <div>
              <div className="text-base leading-none font-bold tracking-tight">
                FitLab
              </div>
              <div className="mt-0.5 text-[11px] font-medium tracking-widest text-lime-400/90 uppercase">
                Client
              </div>
            </div>
          </div>

          <nav className="mt-8 flex flex-col gap-1">
            {NAV.map(({ to, label, icon: Icon, end, soon }) => (
              <NavLink
                key={to}
                to={soon ? "#" : to}
                end={end}
                onClick={(e) => soon && e.preventDefault()}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    isActive &&
                      !soon &&
                      "bg-lime-400/10 text-lime-300 hover:bg-lime-400/15 hover:text-lime-300",
                    soon &&
                      "cursor-default opacity-50 hover:bg-transparent hover:text-muted-foreground",
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
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-3">
            <Avatar className="size-9 border border-lime-400/40">
              <AvatarFallback className="bg-lime-400/15 text-xs font-bold text-lime-300">
                {user?.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{user?.name}</div>
              <div className="truncate text-xs text-muted-foreground">
                {user?.email}
              </div>
            </div>
            <button
              onClick={logout}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Log out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8">
          <Outlet />
        </main>
      </div>

      <AuthenticatedChatbot />
    </div>
  );
}
