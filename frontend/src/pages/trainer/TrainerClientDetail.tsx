// Trainer-side client detail — the synced view of one linked client:
// profile, progress (chart + per-exercise stats), and full workout
// history. The trainer can edit the history (add/delete sessions,
// add/update/delete exercises); every change is written through the
// shared backend routes, so the client sees it too. Data is re-fetched
// after each edit and on a light poll, so client-side updates appear
// here automatically.
// Owned by: Jiachen Sun (trainer-client management).

import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  CalendarPlus,
  ChevronDown,
  Dumbbell,
  Flame,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  TrendingUp,
} from "lucide-react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { ClientSyncData, SyncedExercise, SyncedSession } from "@/types"
import {
  addClientTemplate,
  addSessionExercise,
  addWorkoutSession,
  deleteSessionExercise,
  deleteWorkoutSession,
  getClientTemplates,
  syncClient,
  unlinkClient,
  updateSessionExercise,
} from "@/lib/trainerApi"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  findTemplateByName,
  presetGroupsNotIn,
} from "@/lib/presetExercises"
import { cn } from "@/lib/utils"

interface Template {
  _id: string
  name: string
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Flame
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

// --- inline exercise row with edit mode ---

function ExerciseRow({
  sessionId,
  exercise,
  onChanged,
}: {
  sessionId: string
  exercise: SyncedExercise
  onChanged: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [sets, setSets] = useState(String(exercise.sets))
  const [reps, setReps] = useState(String(exercise.reps))
  const [weight, setWeight] = useState(String(exercise.weight_in_kg))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const valid =
    Number(sets) > 0 && Number(reps) > 0 && Number(weight) >= 0

  const save = async () => {
    if (!valid) return
    setBusy(true)
    setError(null)
    try {
      await updateSessionExercise(sessionId, exercise.exercise_id, {
        sets: Number(sets),
        reps: Number(reps),
        weight_in_kg: Number(weight),
      })
      setEditing(false)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await deleteSessionExercise(sessionId, exercise.exercise_id)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
      setBusy(false)
    }
  }

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-lime-400/40 bg-background/40 p-2 pl-3">
        <span className="min-w-28 flex-1 truncate text-sm font-medium">
          {exercise.name}
        </span>
        {[
          { label: "sets", value: sets, set: setSets, min: 1 },
          { label: "reps", value: reps, set: setReps, min: 1 },
          { label: "kg", value: weight, set: setWeight, min: 0 },
        ].map((f) => (
          <label key={f.label} className="flex items-center gap-1 text-xs text-muted-foreground">
            <Input
              type="number"
              min={f.min}
              step={1}
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              className="h-8 w-16"
              aria-label={`${exercise.name} ${f.label}`}
            />
            {f.label}
          </label>
        ))}
        <div className="flex gap-1.5">
          <Button
            size="sm"
            disabled={busy || !valid}
            onClick={save}
            className="bg-lime-400 text-black hover:bg-lime-300"
          >
            {busy ? <Loader2 className="animate-spin" /> : "Save"}
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
        {error && <p className="w-full text-xs text-destructive">{error}</p>}
      </div>
    )
  }

  return (
    <div className="group/ex flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 p-2 pl-3">
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {exercise.name}
      </span>
      <span className="text-xs text-muted-foreground">
        {exercise.sets} × {exercise.reps}
        {exercise.weight_in_kg > 0 && (
          <span className="ml-1.5 font-semibold text-lime-300">
            {exercise.weight_in_kg} kg
          </span>
        )}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Edit ${exercise.name}`}
        className="opacity-0 transition-opacity group-hover/ex:opacity-100"
        onClick={() => setEditing(true)}
      >
        <Pencil />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Delete ${exercise.name}`}
        className="text-destructive opacity-0 transition-opacity group-hover/ex:opacity-100"
        disabled={busy}
        onClick={remove}
      >
        <Trash2 />
      </Button>
    </div>
  )
}

// --- add-exercise form inside a session ---

function AddExerciseForm({
  clientId,
  sessionId,
  templates,
  onChanged,
}: {
  clientId: string
  sessionId: string
  templates: Template[]
  onChanged: () => void
}) {
  const NEW = "__new__"
  const PRESET = "preset:"
  const [templateId, setTemplateId] = useState("")
  const [newName, setNewName] = useState("")
  const [sets, setSets] = useState("3")
  const [reps, setReps] = useState("10")
  const [weight, setWeight] = useState("0")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Common movements the client hasn't saved yet. Choosing one adds it to
  // their library on first use, so trainers don't have to type it out.
  const presetGroups = useMemo(() => presetGroupsNotIn(templates), [templates])
  const isPreset = templateId.startsWith(PRESET)

  const valid =
    (templateId === NEW ? newName.trim().length > 0 : templateId) &&
    Number(sets) > 0 &&
    Number(reps) > 0 &&
    Number(weight) >= 0

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    setBusy(true)
    setError(null)
    try {
      let id = templateId
      if (templateId === NEW || isPreset) {
        const name = isPreset
          ? templateId.slice(PRESET.length)
          : newName.trim()
        // A preset may already exist under the same name (e.g. the client
        // added it themselves between fetches) — reuse it instead of
        // creating a duplicate.
        const existing = findTemplateByName(templates, name)
        id = existing?._id ?? (await addClientTemplate(clientId, name))._id
      }
      await addSessionExercise(sessionId, {
        exercise_template_id: id,
        sets: Number(sets),
        reps: Number(reps),
        weight_in_kg: Number(weight),
      })
      setTemplateId("")
      setNewName("")
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border/70 p-2">
      <select
        value={templateId}
        onChange={(e) => setTemplateId(e.target.value)}
        aria-label="Exercise"
        className="h-8 min-w-36 flex-1 rounded-lg border border-input bg-input/30 px-2 text-sm outline-none focus-visible:border-ring"
      >
        <option value="" disabled>
          Add exercise…
        </option>
        {templates.length > 0 && (
          <optgroup label="Client's library">
            {templates.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </optgroup>
        )}
        {presetGroups.map((g) => (
          <optgroup key={g.category} label={`Common · ${g.category}`}>
            {g.exercises.map((name) => (
              <option key={name} value={`${PRESET}${name}`}>
                {name}
              </option>
            ))}
          </optgroup>
        ))}
        <option value={NEW}>+ Custom exercise…</option>
      </select>
      {isPreset && (
        <span className="rounded-full bg-lime-400/10 px-2 py-1 text-[11px] font-medium text-lime-300">
          Adds to library
        </span>
      )}
      {templateId === NEW && (
        <Input
          placeholder="Exercise name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="h-8 w-36"
          aria-label="New exercise name"
        />
      )}
      {[
        { label: "sets", value: sets, set: setSets, min: 1 },
        { label: "reps", value: reps, set: setReps, min: 1 },
        { label: "kg", value: weight, set: setWeight, min: 0 },
      ].map((f) => (
        <label key={f.label} className="flex items-center gap-1 text-xs text-muted-foreground">
          <Input
            type="number"
            min={f.min}
            step={1}
            value={f.value}
            onChange={(e) => f.set(e.target.value)}
            className="h-8 w-16"
            aria-label={`New exercise ${f.label}`}
          />
          {f.label}
        </label>
      ))}
      <Button
        type="submit"
        size="sm"
        disabled={busy || !valid}
        className="bg-lime-400 text-black hover:bg-lime-300"
      >
        {busy ? <Loader2 className="animate-spin" /> : <Plus />}
      </Button>
      {error && <p className="w-full text-xs text-destructive">{error}</p>}
    </form>
  )
}

// --- one expandable session ---

function SessionCard({
  clientId,
  session,
  templates,
  defaultOpen,
  onChanged,
}: {
  clientId: string
  session: SyncedSession
  templates: Template[]
  defaultOpen: boolean
  onChanged: () => void
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [busy, setBusy] = useState(false)

  const removeSession = async () => {
    setBusy(true)
    try {
      await deleteWorkoutSession(session.session_id)
      onChanged()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card/40">
      <div className="flex w-full items-center gap-2 p-3">
        <button
          onClick={() => setOpen(!open)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-expanded={open}
        >
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              !open && "-rotate-90"
            )}
          />
          <span className="truncate text-sm font-medium">
            {formatDate(session.session_date)}
          </span>
          <Badge variant="secondary" className="ml-1 shrink-0">
            {session.exercises.length} exercise{session.exercises.length === 1 ? "" : "s"}
          </Badge>
        </button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Delete session"
          className="text-destructive"
          disabled={busy}
          onClick={removeSession}
        >
          {busy ? <Loader2 className="animate-spin" /> : <Trash2 />}
        </Button>
      </div>

      {open && (
        <div className="flex flex-col gap-2 border-t border-border/60 p-3">
          {session.exercises.map((exercise) => (
            <ExerciseRow
              key={exercise.exercise_id}
              sessionId={session.session_id}
              exercise={exercise}
              onChanged={onChanged}
            />
          ))}
          <AddExerciseForm
            clientId={clientId}
            sessionId={session.session_id}
            templates={templates}
            onChanged={onChanged}
          />
        </div>
      )}
    </div>
  )
}

// --- the page ---

export default function TrainerClientDetail() {
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()

  const [data, setData] = useState<ClientSyncData | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartTemplateId, setChartTemplateId] = useState<string | null>(null)
  const [newSessionDate, setNewSessionDate] = useState("")
  const [addingSession, setAddingSession] = useState(false)

  const refresh = useCallback(async () => {
    if (!clientId) return
    try {
      const [sync, tpls] = await Promise.all([
        syncClient(clientId),
        getClientTemplates(clientId),
      ])
      setData(sync)
      setTemplates(tpls)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load client.")
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    // Initial load + light polling, so the client's own updates flow in.
    const first = setTimeout(refresh, 0)
    const id = setInterval(refresh, 15_000)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [refresh])

  // Chart series: the client's logged weight over time for one exercise.
  const chartTemplate =
    chartTemplateId ?? data?.progress[0]?.exercise_template_id ?? null

  const chartData = useMemo(() => {
    if (!data || !chartTemplate) return []
    return [...data.sessions]
      .reverse() // oldest → newest
      .map((s) => {
        const match = s.exercises.filter(
          (e) => e.exercise_template_id === chartTemplate
        )
        if (match.length === 0) return null
        return {
          date: new Date(s.session_date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          }),
          weight: Math.max(...match.map((e) => e.weight_in_kg)),
        }
      })
      .filter((p): p is { date: string; weight: number } => p !== null)
  }, [data, chartTemplate])

  const addSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId || !newSessionDate) return
    setAddingSession(true)
    try {
      await addWorkoutSession(clientId, new Date(newSessionDate).toISOString())
      setNewSessionDate("")
      refresh()
    } finally {
      setAddingSession(false)
    }
  }

  const handleUnlink = async () => {
    if (!clientId) return
    await unlinkClient(clientId)
    navigate("/trainer/clients")
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-16 animate-pulse rounded-xl bg-muted/40" />
        <div className="h-64 animate-pulse rounded-xl bg-muted/40" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-start gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/trainer/clients">
            <ArrowLeft data-icon="inline-start" /> Back to clients
          </Link>
        </Button>
        <p className="text-sm text-destructive">
          {error ?? "Client not found."} They may no longer be linked with you.
        </p>
      </div>
    )
  }

  const lastSession = data.sessions[0]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
          <Link to="/trainer/clients">
            <ArrowLeft data-icon="inline-start" /> Clients
          </Link>
        </Button>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <Avatar className="size-14 border border-lime-400/40">
            <AvatarFallback className="bg-lime-400/15 text-lg font-bold text-lime-300">
              {initials(data.client.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
              {data.client.name}
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              {data.client.email}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleUnlink}>
            Unlink
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <StatTile icon={Flame} label="Total sessions" value={data.total_sessions} />
        <StatTile
          icon={Dumbbell}
          label="Exercises tracked"
          value={data.progress.length}
        />
        <StatTile
          icon={TrendingUp}
          label="Last session"
          value={lastSession ? formatDate(lastSession.session_date) : "—"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        {/* Progress */}
        <Card className="border-border/60 bg-card/60 py-5 backdrop-blur xl:col-span-3">
          <CardHeader className="flex-row flex-wrap items-center gap-2 px-5">
            <CardTitle className="text-sm">Progress</CardTitle>
            {data.progress.length > 0 && (
              <select
                value={chartTemplate ?? ""}
                onChange={(e) => setChartTemplateId(e.target.value)}
                aria-label="Exercise for chart"
                className="ml-auto h-8 rounded-lg border border-input bg-input/30 px-2 text-xs outline-none focus-visible:border-ring"
              >
                {data.progress.map((p) => (
                  <option key={p.exercise_template_id} value={p.exercise_template_id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </CardHeader>
          <CardContent className="px-5">
            {chartData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No logged weights yet — the chart appears once sessions with
                weights are recorded.
              </p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.5} />
                    <YAxis tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.5} unit=" kg" />
                    <Tooltip
                      contentStyle={{
                        background: "oklch(0.18 0 0)",
                        border: "1px solid oklch(0.3 0 0)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="oklch(0.85 0.21 128)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* per-exercise stats */}
            {data.progress.length > 0 && (
              <div className="mt-4 flex flex-col gap-1.5">
                {data.progress.map((p) => (
                  <div
                    key={p.exercise_template_id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-xs"
                  >
                    <span className="min-w-24 flex-1 truncate font-medium text-foreground">
                      {p.name}
                    </span>
                    <span className="text-muted-foreground">
                      ×{p.times_performed}
                    </span>
                    <span className="text-muted-foreground">
                      max <span className="font-semibold text-foreground">{p.max_weight_in_kg} kg</span>
                    </span>
                    <span
                      className={cn(
                        "font-semibold",
                        p.weight_change_in_kg > 0 && "text-lime-300",
                        p.weight_change_in_kg < 0 && "text-rose-300",
                        p.weight_change_in_kg === 0 && "text-muted-foreground"
                      )}
                    >
                      {p.weight_change_in_kg > 0 && "+"}
                      {p.weight_change_in_kg} kg
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workout history (editable) */}
        <Card className="border-border/60 bg-card/60 py-5 backdrop-blur xl:col-span-2">
          <CardHeader className="flex-row items-center gap-2 px-5">
            <CardTitle className="text-sm">Workout history</CardTitle>
            <Badge variant="secondary" className="ml-1">{data.sessions.length}</Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 px-5">
            <form onSubmit={addSession} className="flex gap-2">
              <Input
                type="date"
                value={newSessionDate}
                onChange={(e) => setNewSessionDate(e.target.value)}
                aria-label="New session date"
              />
              <Button
                type="submit"
                disabled={addingSession || !newSessionDate}
                className="shrink-0 bg-lime-400 font-semibold text-black hover:bg-lime-300"
              >
                {addingSession ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <CalendarPlus data-icon="inline-start" />
                )}
                Log session
              </Button>
            </form>

            {data.sessions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No sessions yet — log the first one above.
              </p>
            ) : (
              data.sessions.map((session, i) => (
                <SessionCard
                  key={session.session_id}
                  clientId={data.client.client_id}
                  session={session}
                  templates={templates}
                  defaultOpen={i === 0}
                  onChanged={refresh}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
