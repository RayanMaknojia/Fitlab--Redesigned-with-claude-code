// Pick one of the built-in workouts (5-day split + other activities) and
// preview its exercises with default sets × reps.

import { Check } from "lucide-react"

import { WORKOUT_PRESETS, normalizeName, type WorkoutPreset } from "@/lib/workoutPresets"
import { cn } from "@/lib/utils"

const GROUPS: { key: WorkoutPreset["group"]; title: string }[] = [
  { key: "split", title: "5-day split" },
  { key: "activity", title: "Other activities" },
]

export default function WorkoutPresetPicker({
  selectedId,
  onSelect,
  ownedNames,
}: {
  selectedId: string | null
  onSelect: (id: string) => void
  /** Lower-cased names of exercise templates the client already has. */
  ownedNames?: Set<string>
}) {
  const selected = WORKOUT_PRESETS.find((p) => p.id === selectedId) ?? null

  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_1.1fr]">
      <div className="flex max-h-[22rem] flex-col gap-4 overflow-y-auto pr-1">
        {GROUPS.map((g) => (
          <div key={g.key} className="flex flex-col gap-1.5">
            <div className="px-1 text-xs font-semibold text-muted-foreground">{g.title}</div>
            <div role="radiogroup" aria-label={g.title} className="flex flex-col gap-1">
              {WORKOUT_PRESETS.filter((p) => p.group === g.key).map((p) => {
                const active = p.id === selectedId
                const Icon = p.icon
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => onSelect(p.id)}
                    className={cn(
                      "press flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                      active
                        ? "border-primary bg-secondary"
                        : "border-transparent hover:bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-md",
                        active ? "bg-primary text-primary-foreground" : "bg-secondary text-primary",
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{p.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {p.day ? `${p.day} · ` : ""}
                        {p.exercises.length} exercises
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-muted/40 p-4">
        {selected ? (
          <div key={selected.id} className="flex animate-fade-in flex-col gap-3">
            <div>
              <div className="font-semibold">{selected.name}</div>
              <p className="text-sm text-muted-foreground">{selected.summary}</p>
            </div>
            <ul className="flex flex-col divide-y divide-border">
              {selected.exercises.map((e) => {
                const owned = ownedNames?.has(normalizeName(e.name))
                return (
                  <li key={e.name} className="flex items-center gap-2 py-2 text-sm">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{e.name}</span>
                      {e.note && <span className="block text-xs text-muted-foreground">{e.note}</span>}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {e.sets} × {e.reps}
                    </span>
                    {owned && (
                      <Check className="size-4 shrink-0 text-primary" aria-label="Already in your templates" />
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ) : (
          <p className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
            Pick a workout to see its exercises.
          </p>
        )}
      </div>
    </div>
  )
}
