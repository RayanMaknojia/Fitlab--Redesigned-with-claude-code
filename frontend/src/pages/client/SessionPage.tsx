import DialogFormButton from "@/components/client/DialogFormButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import AddExerciseDialog, {
  type SingleExerciseInput,
} from "@/components/client/templates/AddExerciseDialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import {
  addExerciseTemplate,
  addExerciseToSession,
  deleteExerciseById,
  getExerciseTemplates,
  getSessionById,
  getSessionExercisesById,
  updateExerciseById,
} from "@/lib/clientApi";
import displayError from "@/lib/displayError";
import {
  type ExerciseTemplate,
  type SessionExercise,
  type WorkoutSession,
} from "@/types/client";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { normalizeName, type WorkoutPreset } from "@/lib/workoutPresets";
import { Toaster } from "sonner";

export default function SessionPage() {
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [exercises, setExercises] = useState<SessionExercise[]>([]);
  const [templates, setTemplates] = useState<ExerciseTemplate[]>([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const params = useParams();

  useEffect(() => {
    async function fetchData() {
      try {
        if (!params.sessionId) {
          throw new Error("Session ID is invalid.");
        }

        setSession(await getSessionById(params.sessionId));
        setExercises(await getSessionExercisesById(params.sessionId));
        setTemplates(await getExerciseTemplates(user!.id));
      } catch (e: unknown) {
        displayError(
          e instanceof Error ? e.message : "Could not fetch session data",
        );
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.sessionId, user]);

  // Returns the id of the client's template with this name, creating it
  // (and remembering it locally) when it doesn't exist yet.
  const ensureTemplate = async (
    name: string,
    known: ExerciseTemplate[],
  ): Promise<{ id: string; created?: ExerciseTemplate }> => {
    const existing = known.find(
      (t) => normalizeName(t.name) === normalizeName(name),
    );
    if (existing) return { id: existing._id };
    const created = await addExerciseTemplate(user!.id, name);
    return { id: created._id, created };
  };

  const handleAddOne = async (input: SingleExerciseInput) => {
    let templateId = input.templateId;
    if (!templateId) {
      const { id, created } = await ensureTemplate(input.name, templates);
      templateId = id;
      if (created) setTemplates((prev) => [...prev, created]);
    }
    const newExercise = await addExerciseToSession(session!._id as string, {
      exercise_template_id: templateId,
      sets: input.sets,
      reps: input.reps,
      weight_in_kg: input.weight_in_kg,
    });
    setExercises((prev) => [
      ...prev,
      { ...newExercise, template_name: newExercise.template_name ?? input.name },
    ]);
  };

  // Logs every exercise of a preset workout, creating missing templates.
  const handleAddWorkout = async (preset: WorkoutPreset) => {
    const known = [...templates];
    const added: SessionExercise[] = [];
    try {
      for (const ex of preset.exercises) {
        const { id, created } = await ensureTemplate(ex.name, known);
        if (created) known.push(created);
        const newExercise = await addExerciseToSession(
          session!._id as string,
          {
            exercise_template_id: id,
            sets: ex.sets,
            reps: ex.reps,
            weight_in_kg: 0,
          },
        );
        added.push({
          ...newExercise,
          template_name: newExercise.template_name ?? ex.name,
        });
      }
    } finally {
      setTemplates(known);
      if (added.length) setExercises((prev) => [...prev, ...added]);
    }
  };

  const handleUpdate = async (
    e: React.SubmitEvent<Element>,
    exerciseId: string,
  ) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget as HTMLFormElement);

    if (!formData.get("sets") || !formData.get("reps")) {
      displayError("Must enter in sets and reps");
      return;
    }

    const sets = Number(formData.get("sets") as string);
    const reps = Number(formData.get("reps") as string);

    const weight_in_kg = formData.get("weight_in_kg")
      ? Number(formData.get("weight_in_kg") as string)
      : 0;

    try {
      const newExerciseData: SessionExercise = await updateExerciseById(
        session!._id as string,
        exerciseId,
        {
          sets,
          reps,
          weight_in_kg,
        },
      );

      setExercises(
        exercises.map((e) =>
          e._id === exerciseId ? { ...e, ...newExerciseData } : e,
        ),
      );
    } catch (e: unknown) {
      displayError(e instanceof Error ? e.message : "Could not add exercise.");
    }
  };

  const handleDelete = async (exerciseId: string) => {
    try {
      await deleteExerciseById(session!._id as string, exerciseId);
      setExercises(exercises.filter((e) => e._id !== exerciseId));
    } catch (e: unknown) {
      displayError(
        e instanceof Error ? e.message : "Could not delete exercise.",
      );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {session
            ? new Date(session.session_date).toLocaleString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Invalid session"}
        </h1>
        <Link to="/client/workout-sessions">
          <Button className="bg-primary font-semibold text-primary-foreground hover:bg-primary/90 w-max">
            Back
          </Button>
        </Link>
      </div>
      {!loading && !session ? null : (
        <>
          <div className="flex gap-2">
            {!loading && (
              <AddExerciseDialog
                templates={templates}
                onAddOne={handleAddOne}
                onAddWorkout={handleAddWorkout}
              />
            )}
          </div>
          <Card className="border-border bg-card shadow-[0_1px_2px_rgb(11_21_48/0.04)] py-5 p-6 flex">
            {loading ? (
              <div className="h-64 animate-pulse rounded-lg bg-muted/40" />
            ) : exercises.length > 0 ? (
              exercises.map((e) => {
                return (
                  <Item variant="outline" key={e._id} data-testid="session-exercise">
                    <ItemContent>
                      <ItemTitle>{e.template_name}</ItemTitle>
                      <ItemDescription>
                        {e.sets} sets, {e.reps} reps
                        {e.weight_in_kg > 0 && `, ${e.weight_in_kg} kg`}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <DialogFormButton
                        dialogTriggerButton={
                          <Button size="sm" variant="outline">
                            Update
                          </Button>
                        }
                        dialogHeaderText="Update this exercise"
                        submitButtonText="Update exercise"
                        closeButtonText="Cancel"
                        handleSubmit={async (event) => {
                          await handleUpdate(event, e._id as string);
                        }}
                        modal={false}
                      >
                        <FieldGroup>
                          <Field>
                            <Label htmlFor="sets" className="text-foreground">
                              Sets
                            </Label>
                            <Input
                              id="sets"
                              name="sets"
                              type="number"
                              className="text-foreground"
                              min={1}
                            />
                          </Field>
                          <Field>
                            <Label htmlFor="reps" className="text-foreground">
                              Reps
                            </Label>
                            <Input
                              id="reps"
                              name="reps"
                              type="number"
                              className="text-foreground"
                              min={1}
                            />
                          </Field>
                          <Field>
                            <Label
                              htmlFor="weight_in_kg"
                              className="text-foreground"
                            >
                              Weight in kg (optional)
                            </Label>
                            <Input
                              id="weight_in_kg"
                              name="weight_in_kg"
                              type="number"
                              className="text-foreground"
                              min={0}
                            />
                          </Field>
                        </FieldGroup>
                      </DialogFormButton>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () =>
                          await handleDelete(e._id as string)
                        }
                      >
                        Delete
                      </Button>
                    </ItemActions>
                  </Item>
                );
              })
            ) : (
              <p>No exercises yet.</p>
            )}
          </Card>
          <Toaster />
        </>
      )}
    </div>
  );
}
