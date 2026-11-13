// Client app shell — FitLab light theme; layout lives in AppShell.
// Owned by: [your name] (progress dashboard / client view).

import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Bell, Calendar, CalendarClock, ClipboardClock, LayoutDashboard, LineChart, Search, Settings, UserSquare2 } from "lucide-react";

import AppShell, { type NavItem } from "@/components/AppShell";
import AuthenticatedChatbot from "@/components/chatbot/AuthenticatedChatbot";
import { getMyNotifications } from "@/lib/notificationsApi";

const NAV: NavItem[] = [
  { to: "/client", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/client/progress", label: "Progress", icon: LineChart, end: false },
  {
    to: "/client/exercise-templates",
    label: "Exercise Templates",
    icon: ClipboardClock,
    end: false,
  },
  {
    to: "/client/workout-sessions",
    label: "Workout Sessions",
    icon: CalendarClock,
    end: false,
  },
  { to: "/client/browse", label: "Find trainers", icon: Search, end: false },
  {
    to: "/client/my-listing",
    label: "My listing",
    icon: UserSquare2,
    end: false,
  },
  {
    to: "/client/notifications",
    label: "Notifications",
    icon: Bell,
    end: false,
  },
  {
    to: "/client/schedule",
    label: "Schedule",
    icon: Calendar,
    end: false,
  },
  {
    to: "/client/settings",
    label: "Settings",
    icon: Settings,
    end: false,
  },
]

export default function ClientLayout() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const refresh = () =>
      getMyNotifications().then((n) =>
        setUnreadCount(n.filter((x) => !x.read).length),
      );
    const first = setTimeout(refresh, 0);
    const id = setInterval(refresh, 10_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  return (
    <>
      <AppShell
        role="Client"
        nav={NAV}
        badges={{ "/client/notifications": unreadCount }}
      >
        <Outlet />
      </AppShell>
      <AuthenticatedChatbot />
    </>
  );
}
