// "Add an exercise" dialog for a workout session.
//   Single exercise: pick from your templates (or a suggested popular
//                    exercise, which becomes a template) and set sets/reps/kg.
//   Full workout:    log every exercise of a preset workout at once, with its
//                    default sets × reps.

import { useMemo, useState, type FormEvent } from "react"
import { Check, Loader2, Plus, Search } from "lucide-react"

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
import {
  POPULAR_EXERCISES,
  WORKOUT_PRESETS,
  normalizeName,
  type WorkoutPreset,
} from "@/lib/workoutPresets"
import { cn } from "@/lib/utils"
import type { ExerciseTemplate } from "@/types/client"
import SegmentedTabs from "./SegmentedTabs"
import WorkoutPresetPicker from "./WorkoutPresetPicker"

type Tab = "single" | "workout"

export interface SingleExerciseInput {
  name: string
  /** Existing template id, or null when the template must be created first. */
  templateId: string | null
  sets: number
  reps: number
  weight_in_kg: number
}

type Option = { key: string; name: string; templateId: string | null }

export default function AddExerciseDialog({
  templates,
  onAddOne,
  onAddWorkout,
}: {
  templates: ExerciseTemplate[]
  onAddOne: (input: SingleExerciseInput) => Promise<void>
  onAddWorkout: (preset: WorkoutPreset) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>("single")
  const [query, setQuery] = useState("")
  const [choice, setChoice] = useState<Option | null>(null)
  const [sets, setSets] = useState("3")
  const [reps, setReps] = useState("10")
  const [weight, setWeight] = useState("")
  const [presetId, setPresetId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ownedNames = useMemo(() => new Set(templates.map((t) => normalizeName(t.name))), [templates])

  const options = useMemo(() => {
    const q = normalizeName(query)
    const mine: Option[] = templates.map((t) => ({ key: t._id, name: t.name, templateId: t._id }))
    const suggested: Option[] = POPULAR_EXERCISES.filter((n) => !ownedNames.has(normalizeName(n))).map((n) => ({
      key: `suggested:${n}`,
      name: n,
      templateId: null,
    }))
    const match = (o: Option) => !q || normalizeName(o.name).includes(q)
    return { mine: mine.filter(match), suggested: suggested.filter(match) }
  }, [templates, ownedNames, query])

  const reset = () => {
    setTab("single")
    setQuery("")
    setChoice(null)
    setSets("3")
    setReps("10")
    setWeight("")
    setPresetId(null)
    setError(null)
  }

  const preset = WORKOUT_PRESETS.find((p) => p.id === presetId) ?? null

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (tab === "single") {
      const s = Number(sets)
      const r = Number(reps)
      const w = weight === "" ? 0 : Number(weight)
      if (!choice) return setError("Choose an exercise first.")
      if (!Number.isInteger(s) || s < 1 || !Number.isInteger(r) || r < 1)
        return setError("Sets and reps must be whole numbers of at least 1.")
      if (!Number.isInteger(w) || w < 0) return setError("Weight must be a whole number of kg (0 or more).")
      setBusy(true)
      try {
        await onAddOne({ name: choice.name, templateId: choice.templateId, sets: s, reps: r, weight_in_kg: w })
        setOpen(false)
        reset()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add exercise.")
      } finally {
        setBusy(false)
      }
    } else {
      if (!preset) return setError("Choose a workout first.")
      setBusy(true)
      try {
        await onAddWorkout(preset)
        setOpen(false)
        reset()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add workout.")
      } finally {
        setBusy(false)
      }
    }
  }

  const renderOption = (o: Option) => {
    const on = choice?.key === o.key
    return (
      <button
        key={o.key}
        type="button"
        role="radio"
        aria-checked={on}
        onClick={() => setChoice(o)}
        className={cn(
          "press flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
          on ? "bg-primary text-primary-foreground" : "hover:bg-muted",
        )}
      >
        <span className="min-w-0 flex-1 truncate font-medium">{o.name}</span>
        {on && <Check className="size-4 shrink-0" />}
      </button>
    )
  }

  const submitLabel =
    tab === "single"
      ? "Add to session"
      : preset
        ? `Add ${preset.exercises.length} exercises`
        : "Add workout"

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
          <Plus data-icon="inline-start" /> Add an exercise
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-5 sm:max-w-2xl">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle className="text-lg">Add to this session</DialogTitle>
            <DialogDescription>
              Log one exercise, or a whole workout with suggested sets and reps you can edit
              afterwards.
            </DialogDescription>
          </DialogHeader>

          <SegmentedTabs
            label="Add"
            value={tab}
            onChange={(t) => {
              setTab(t)
              setError(null)
            }}
            options={[
              { value: "single", label: "Single exercise" },
              { value: "workout", label: "Full workout" },
            ]}
          />

          {tab === "single" ? (
            <div className="grid animate-fade-in gap-5 sm:grid-cols-[1.2fr_1fr]">
              <div className="flex flex-col gap-2">
                <Label htmlFor="exercise-search">Exercise</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="exercise-search"
                    placeholder="Search exercises"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div
                  role="radiogroup"
                  aria-label="Exercise"
                  className="flex max-h-64 flex-col gap-0.5 overflow-y-auto rounded-lg border border-border p-1"
                >
                  {options.mine.length > 0 && (
                    <>
                      <div className="px-3 pt-1.5 pb-1 text-xs font-semibold text-muted-foreground">
                        Your templates
                      </div>
                      {options.mine.map(renderOption)}
                    </>
                  )}
                  {options.suggested.length > 0 && (
                    <>
                      <div className="px-3 pt-2 pb-1 text-xs font-semibold text-muted-foreground">
                        Suggested · saved to your templates when added
                      </div>
                      {options.suggested.map(renderOption)}
                    </>
                  )}
                  {options.mine.length + options.suggested.length === 0 && (
                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No exercises match “{query}”. Add it on the Exercise Templates page.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="ex-sets">Sets</Label>
                    <Input id="ex-sets" type="number" inputMode="numeric" min={1} step={1} value={sets} onChange={(e) => setSets(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="ex-reps">Reps</Label>
                    <Input id="ex-reps" type="number" inputMode="numeric" min={1} step={1} value={reps} onChange={(e) => setReps(e.target.value)} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ex-weight">Weight (kg)</Label>
                  <Input
                    id="ex-weight"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    placeholder="Optional"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
                <div className="rounded-lg bg-muted/60 p-3 text-sm">
                  {choice ? (
                    <>
                      <span className="font-medium">{choice.name}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        · {sets || "–"} × {reps || "–"}
                        {weight ? ` @ ${weight} kg` : ""}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Choose an exercise from the list.</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              <WorkoutPresetPicker selectedId={presetId} onSelect={setPresetId} ownedNames={ownedNames} />
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="press">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className="press min-w-36 font-semibold" disabled={busy}>
              {busy && <Loader2 data-icon="inline-start" className="animate-spin" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
