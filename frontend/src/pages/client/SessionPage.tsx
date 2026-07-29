import DialogFormButton from "@/components/client/DialogFormButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
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

  const handleSubmit = async (e: React.SubmitEvent<Element>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget as HTMLFormElement);

    if (!formData.get("exercise-template-combobox")) {
      displayError("Must choose a template");
      return;
    }

    const exercise_template_id = formData.get(
      "exercise-template-combobox",
    )! as string;

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
      const newExercise = await addExerciseToSession(session!._id as string, {
        exercise_template_id,
        sets,
        reps,
        weight_in_kg,
      });

      setExercises([...exercises, newExercise]);
    } catch (e: unknown) {
      displayError(e instanceof Error ? e.message : "Could not add exercise.");
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
          <Button className="bg-lime-400 font-semibold text-black hover:bg-lime-300 w-max">
            Back
          </Button>
        </Link>
      </div>
      {!loading && !session ? null : (
        <>
          <div className="flex gap-2">
            {!loading && (
              <DialogFormButton
                dialogTriggerButton={
                  <Button className="bg-lime-400 font-semibold text-black hover:bg-lime-300 w-max">
                    Add an exercise
                  </Button>
                }
                dialogHeaderText="Add a exercise"
                submitButtonText="Add exercise"
                closeButtonText="Cancel"
                handleSubmit={handleSubmit}
                modal={false}
              >
                <FieldGroup>
                  <Field>
                    <Label
                      htmlFor="exercise-template-combobox"
                      className="text-white"
                    >
                      Exercise name
                    </Label>
                    <Combobox
                      name="exercise-template-combobox"
                      items={templates}
                      itemToStringValue={(t: ExerciseTemplate) => t._id}
                      itemToStringLabel={(t: ExerciseTemplate) => t.name}
                    >
                      <ComboboxInput
                        placeholder="Select an exercise template"
                        className="text-white"
                        id="exercise-template-combobox"
                      />
                      <ComboboxContent className="dark">
                        <ComboboxEmpty>No templates found.</ComboboxEmpty>
                        <ComboboxList>
                          {(t) => (
                            <ComboboxItem key={t._id} value={t}>
                              {t.name}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </Field>
                  <Field>
                    <Label htmlFor="sets" className="text-white">
                      Sets
                    </Label>
                    <Input
                      id="sets"
                      name="sets"
                      type="number"
                      className="text-white"
                      min={1}
                    />
                  </Field>
                  <Field>
                    <Label htmlFor="reps" className="text-white">
                      Reps
                    </Label>
                    <Input
                      id="reps"
                      name="reps"
                      type="number"
                      className="text-white"
                      min={1}
                    />
                  </Field>
                  <Field>
                    <Label htmlFor="weight_in_kg" className="text-white">
                      Weight in kg (optional)
                    </Label>
                    <Input
                      id="weight_in_kg"
                      name="weight_in_kg"
                      type="number"
                      className="text-white"
                      min={0}
                    />
                  </Field>
                </FieldGroup>
              </DialogFormButton>
            )}
          </div>
          <Card className="border-border/60 bg-card/60 py-5 backdrop-blur p-6 flex">
            {loading ? (
              <div className="h-64 animate-pulse rounded-lg bg-muted/40" />
            ) : exercises.length > 0 ? (
              exercises.map((e) => {
                return (
                  <Item variant="outline" key={e._id}>
                    <ItemContent>
                      <ItemTitle>{e.template_name}</ItemTitle>
                      <ItemDescription>
                        {e.sets} sets, {e.reps} reps
                        {e.weight_in_kg > 0 && `, ${e.weight_in_kg} sets`}
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
                            <Label htmlFor="sets" className="text-white">
                              Sets
                            </Label>
                            <Input
                              id="sets"
                              name="sets"
                              type="number"
                              className="text-white"
                              min={1}
                            />
                          </Field>
                          <Field>
                            <Label htmlFor="reps" className="text-white">
                              Reps
                            </Label>
                            <Input
                              id="reps"
                              name="reps"
                              type="number"
                              className="text-white"
                              min={1}
                            />
                          </Field>
                          <Field>
                            <Label
                              htmlFor="weight_in_kg"
                              className="text-white"
                            >
                              Weight in kg (optional)
                            </Label>
                            <Input
                              id="weight_in_kg"
                              name="weight_in_kg"
                              type="number"
                              className="text-white"
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
