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
import {
  addClientSession,
  updateSessionById,
  getClientSessions,
  deleteSessionById,
} from "@/lib/clientApi";
import displayError from "@/lib/displayError";
import type { WorkoutSession } from "@/types/client";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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

  const handleUpdate = async (e: React.SubmitEvent, sessionId: string) => {
    e.preventDefault();
    const formData = new FormData(
      (e as React.SubmitEvent<HTMLFormElement>).currentTarget,
    );

    const date = formData.get("date")!.valueOf();

    try {
      const newSession = await updateSessionById(sessionId, date as string);
      newSession._id = sessionId;
      setSessions(sessions.map((s) => (s._id === sessionId ? newSession : s)));
    } catch (e: unknown) {
      displayError(
        e instanceof Error ? e.message : "Could not update session.",
      );
    }
  };

  const handleDelete = async (sessionId: string) => {
    try {
      await deleteSessionById(sessionId);
      setSessions(sessions.filter((s) => s._id !== sessionId));
    } catch (e: unknown) {
      displayError(
        e instanceof Error ? e.message : "Could not delete session.",
      );
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
          <Button className="bg-primary font-semibold text-primary-foreground hover:bg-primary/90 w-max">
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
            <Label htmlFor="date" className="text-foreground">
              Date
            </Label>
            <Input
              id="date"
              name="date"
              className="text-foreground"
              type="datetime-local"
            />
          </Field>
        </FieldGroup>
      </DialogFormButton>
      <Card className="border-border bg-card shadow-[0_1px_2px_rgb(11_21_48/0.04)] py-5 p-6 flex">
        {loading ? (
          <div className="h-64 animate-pulse rounded-lg bg-muted/40" />
        ) : sessions.length > 0 ? (
          sessions.map((s) => {
            return (
              <Item variant="outline" key={s._id}>
                <ItemContent>
                  <ItemTitle>
                    {new Date(s.session_date).toLocaleString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </ItemTitle>
                </ItemContent>
                <ItemActions>
                  <Button size="sm" variant="outline">
                    <Link to={s._id as string}>View</Link>
                  </Button>
                  <DialogFormButton
                    dialogTriggerButton={
                      <Button size="sm" variant="outline">
                        Update
                      </Button>
                    }
                    dialogHeaderText="Update session date"
                    submitButtonText="Update date"
                    closeButtonText="Cancel"
                    handleSubmit={async (e) => handleUpdate(e, s._id as string)}
                  >
                    <FieldGroup>
                      <Field>
                        <Label htmlFor="date" className="text-foreground">
                          Date
                        </Label>
                        <Input
                          id="date"
                          name="date"
                          className="text-foreground"
                          type="datetime-local"
                        />
                      </Field>
                    </FieldGroup>
                  </DialogFormButton>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => await handleDelete(s._id as string)}
                  >
                    Delete
                  </Button>
                </ItemActions>
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
