// "Add a template" dialog for the Exercise Templates page.
//   Exercises tab: type a custom name and/or tap popular exercises.
//   Workouts tab:  pick a preset workout; its exercises you don't have yet
//                  are added as templates.

import { useMemo, useState, type FormEvent } from "react"
import { Check, Loader2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { POPULAR_EXERCISES, WORKOUT_PRESETS, normalizeName } from "@/lib/workoutPresets"
import { cn } from "@/lib/utils"
import SegmentedTabs from "./SegmentedTabs"
import WorkoutPresetPicker from "./WorkoutPresetPicker"

type Tab = "exercises" | "workouts"

export default function AddTemplatesDialog({
  ownedNames,
  onCreate,
}: {
  /** Lower-cased names of the client's existing templates. */
  ownedNames: Set<string>
  /** Creates templates for the given names (already de-duplicated). */
  onCreate: (names: string[]) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>("exercises")
  const [custom, setCustom] = useState("")
  const [picked, setPicked] = useState<string[]>([])
  const [presetId, setPresetId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const reset = () => {
    setTab("exercises")
    setCustom("")
    setPicked([])
    setPresetId(null)
  }

  const toAdd = useMemo(() => {
    const raw =
      tab === "exercises"
        ? [...picked, ...(custom.trim() ? [custom.trim()] : [])]
        : (WORKOUT_PRESETS.find((p) => p.id === presetId)?.exercises.map((e) => e.name) ?? [])
    const seen = new Set<string>()
    return raw.filter((n) => {
      const k = normalizeName(n)
      if (ownedNames.has(k) || seen.has(k)) return false
      seen.add(k)
      return true
    })
  }, [tab, picked, custom, presetId, ownedNames])

  const togglePick = (name: string) =>
    setPicked((p) => (p.includes(name) ? p.filter((n) => n !== name) : [...p, name]))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (toAdd.length === 0) return
    setBusy(true)
    try {
      await onCreate(toAdd)
      setOpen(false)
      reset()
    } finally {
      setBusy(false)
    }
  }

  const customDuplicate = custom.trim() !== "" && ownedNames.has(normalizeName(custom))
  const label =
    toAdd.length === 0
      ? tab === "workouts" && presetId
        ? "Already in your templates"
        : "Add templates"
      : `Add ${toAdd.length} template${toAdd.length === 1 ? "" : "s"}`

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button className="press w-max font-semibold">
          <Plus data-icon="inline-start" /> Add a template
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-5 sm:max-w-2xl">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle className="text-lg">Add exercise templates</DialogTitle>
            <DialogDescription>
              Templates are the exercises you can log in your sessions. Add your own, tap
              popular ones, or start from a full workout.
            </DialogDescription>
          </DialogHeader>

          <SegmentedTabs
            label="Add templates from"
            value={tab}
            onChange={setTab}
            options={[
              { value: "exercises", label: "Exercises" },
              { value: "workouts", label: "Workouts" },
            ]}
          />

          {tab === "exercises" ? (
            <div className="flex animate-fade-in flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="custom-template">Custom exercise</Label>
                <Input
                  id="custom-template"
                  placeholder="e.g. Incline Walk"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  aria-describedby={customDuplicate ? "custom-dup" : undefined}
                />
                {customDuplicate && (
                  <p id="custom-dup" className="text-xs text-muted-foreground">
                    You already have this one.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-sm font-medium">Popular exercises</div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_EXERCISES.map((name) => {
                    const owned = ownedNames.has(normalizeName(name))
                    const on = picked.includes(name)
                    return (
                      <button
                        key={name}
                        type="button"
                        disabled={owned}
                        aria-pressed={on}
                        onClick={() => togglePick(name)}
                        className={cn(
                          "press inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                          on && "border-primary bg-primary text-primary-foreground",
                          !on && !owned && "border-border bg-card hover:border-primary/50 hover:bg-secondary",
                          owned && "cursor-default border-transparent bg-muted text-muted-foreground",
                        )}
                      >
                        {(on || owned) && <Check className="size-3.5" />}
                        {name}
                        {owned && <span className="sr-only">(already added)</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              <WorkoutPresetPicker selectedId={presetId} onSelect={setPresetId} ownedNames={ownedNames} />
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="press">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className="press min-w-36 font-semibold" disabled={busy || toAdd.length === 0}>
              {busy && <Loader2 data-icon="inline-start" className="animate-spin" />}
              {label}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
