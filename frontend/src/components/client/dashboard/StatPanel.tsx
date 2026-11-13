// Compact stat panel for the client dashboard (light FitLab theme).

import type { LucideIcon } from "lucide-react"

export default function StatPanel({
  icon: Icon,
  label,
  value,
  note,
  testId,
}: {
  icon: LucideIcon
  label: string
  value: string | number
  note: string
  /** data-testid for the value, used by e2e tests. */
  testId?: string
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgb(11_21_48/0.04)]">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div data-testid={testId} className="mt-1 text-3xl leading-none font-semibold tracking-tight">
          {value}
        </div>
        <div className="mt-2 text-sm text-muted-foreground">{note}</div>
      </div>
    </div>
  )
}

export function StatPanelSkeleton() {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5" aria-hidden>
      <div className="size-10 shrink-0 animate-pulse rounded-lg bg-muted" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-7 w-12 animate-pulse rounded bg-muted" />
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}
