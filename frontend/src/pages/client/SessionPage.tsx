import DialogFormButton from "@/components/client/DialogFormButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import { getSessionById } from "@/lib/clientApi";
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
  const [loading, setLoading] = useState(true);
  const params = useParams();

  useEffect(() => {
    async function fetchData() {
      try {
        if (!params.sessionId) {
          throw new Error("Session ID is invalid.");
        }

        setSession(await getSessionById(params.sessionId));
        setExercises([]);
      } catch (e: unknown) {
        displayError(
          e instanceof Error ? e.message : "Could not fetch session data",
        );
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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
                handleSubmit={async () => {}}
              >
                <FieldGroup>
                  <Field>
                    <Label htmlFor="date" className="text-white">
                      Name
                    </Label>
                    <Input
                      id="date"
                      name="date"
                      className="text-white"
                      type="datetime-local"
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
                      <ItemTitle></ItemTitle>
                    </ItemContent>
                    <ItemActions></ItemActions>
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
