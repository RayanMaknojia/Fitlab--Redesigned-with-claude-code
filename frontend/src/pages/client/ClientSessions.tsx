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
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/context/AuthContext";
import { addClientSession, getClientSessions } from "@/lib/clientApi";
import displayError from "@/lib/displayError";
import type { WorkoutSession } from "@/types/client";
import { useEffect, useState } from "react";

export default function ClientSessions() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getSessionsForClient() {
      try {
        setSessions(await getClientSessions(user?.id as string));
      } catch (e: unknown) {
        displayError(
          e instanceof Error ? e.message : "Could not fetch sessions.",
        );
      } finally {
        setLoading(false);
      }
    }

    getSessionsForClient();
  }, [user?.id]);

  const handleSubmit = async (e: React.SubmitEvent, client_id: string) => {
    e.preventDefault();
    const formData = new FormData(
      (e as React.SubmitEvent<HTMLFormElement>).currentTarget,
    );

    const date = formData.get("date")!.valueOf();

    try {
      const newSession = await addClientSession(client_id, date as string);
      setSessions([...sessions, newSession]);
    } catch (e: unknown) {
      displayError(e instanceof Error ? e.message : "Could not add session.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Your Sessions
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Record workout sessions and exercises within those sessions.
        </p>
      </div>
      <DialogFormButton
        dialogTriggerButton={
          <Button className="bg-lime-400 font-semibold text-black hover:bg-lime-300 w-max">
            Add a session
          </Button>
        }
        dialogHeaderText="Add a session"
        submitButtonText="Add session"
        closeButtonText="Cancel"
        handleSubmit={async (e) => handleSubmit(e, user?.id as string)}
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
      <Card className="border-border/60 bg-card/60 py-5 backdrop-blur p-6 flex">
        {loading ? (
          <div className="h-64 animate-pulse rounded-lg bg-muted/40" />
        ) : sessions.length > 0 ? (
          sessions.map((s) => {
            return (
              <Item variant="outline" key={s._id} className="w-max">
                <ItemContent>
                  <ItemTitle>
                    {new Date(s.session_date).toUTCString()}
                  </ItemTitle>
                </ItemContent>
                <ItemActions></ItemActions>
              </Item>
            );
          })
        ) : (
          <p>No sessions yet.</p>
        )}
      </Card>
      <Toaster />
    </div>
  );
}
