// Same visual pattern as the StatTile inline in TrainerDashboard.tsx,
// pulled out here so both client pages can reuse it.

import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

export default function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string | number
}) {
  return (
    <Card className="flex-1 gap-0 border-border/60 bg-card/60 py-4 backdrop-blur">
      <CardContent className="flex items-center gap-3 px-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-lime-400/10 text-lime-300">
          <Icon className="size-5" />
        </div>
        <div>
          <div className="text-2xl leading-none font-bold tracking-tight">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}
