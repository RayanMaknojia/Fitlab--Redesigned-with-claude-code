// Shared shell for the auth pages (login, register, forgot/reset password).
//   - photo (login page only): a full-screen running photo as the background,
//     with the form in a white card on top of it
//   - otherwise: form column on the left and, on large screens, the FitLab
//     blue gradient with a short product pitch on the right
//
// Photo: public/images/login-runner.jpg
//   "Man running on road near grass field" by Jenny Hill on Unsplash
//   (Unsplash License) https://unsplash.com/photos/mQVWb7kUoOE

import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { CalendarCheck, Dumbbell, LineChart, Users } from "lucide-react"

import { cn } from "@/lib/utils"

const POINTS = [
  { icon: Users, text: "Find a trainer, or clients, that fit your goals" },
  { icon: CalendarCheck, text: "Log every session and keep your streak going" },
  { icon: LineChart, text: "See your progress and personal bests over time" },
]

export function FitLabLogo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn(
        "inline-flex items-center gap-2.5 rounded-lg text-base font-bold tracking-tight focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        className,
      )}
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary bg-fl-banner text-white">
        <Dumbbell className="size-5" />
      </span>
      FitLab
    </Link>
  )
}

export default function AuthShell({
  photo = false,
  children,
}: {
  photo?: boolean
  children: ReactNode
}) {
  if (photo) {
    return (
      <div className="relative isolate flex min-h-screen flex-col text-foreground">
        <img
          src="/images/login-runner.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 -z-20 size-full object-cover object-[65%_center]"
        />
        {/* Navy wash on the left keeps the logo and card legible over the sky. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-linear-to-r from-[#0b1530]/55 via-[#0b1530]/20 to-transparent"
        />
        <div className="px-6 py-6 sm:px-10">
          <FitLabLogo className="text-white" />
        </div>
        <div className="flex flex-1 items-center px-4 pb-10 sm:px-10 lg:px-16">
          <div className="w-full max-w-md rounded-2xl bg-card/95 p-6 shadow-[0_24px_60px_-24px_rgb(11_21_48/0.55)] backdrop-blur-sm sm:p-8">
            {children}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-screen bg-background text-foreground lg:grid-cols-2">
      <div className="flex flex-col px-6 py-6 sm:px-10">
        <div>
          <FitLabLogo />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">{children}</div>
      </div>

      <aside className="relative m-3 hidden overflow-hidden rounded-2xl lg:block">
        <div className="flex size-full flex-col justify-end gap-8 bg-primary bg-fl-banner p-10 text-white">
          <h2 className="max-w-md font-display text-4xl leading-tight font-bold text-balance">
            Training that keeps you and your coach on the same page.
          </h2>
          <ul className="flex flex-col gap-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-base text-white/95">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}
