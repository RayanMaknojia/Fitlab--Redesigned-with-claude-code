import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { getExerciseTemplates } from "@/lib/clientApi";
import type { ExerciseTemplate } from "@/types/client";
import { useEffect, useState } from "react";

export default function ClientExerciseTemplates() {
  const [templates, setTemplates] = useState<ExerciseTemplate[]>([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getTemplatesForClient() {
      try {
        setTemplates(await getExerciseTemplates(user?.id as string));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Could not fetch templates.");
      } finally {
        setLoading(false);
      }
    }

    getTemplatesForClient();
  }, [user?.id]);

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Your Templates
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reuse these exercise names for your session exercises.
          </p>
        </div>
        <Button className="bg-lime-400 font-semibold text-black hover:bg-lime-300 w-max">
          Add a template
        </Button>
        <Card className="border-border/60 bg-card/60 py-5 backdrop-blur p-6 flex">
          {error ? (
            error
          ) : loading ? (
            <div className="h-64 animate-pulse rounded-lg bg-muted/40" />
          ) : templates.length > 0 ? (
            templates.map((t) => <p key={t._id}>{t.name}</p>)
          ) : (
            <p>No templates yet.</p>
          )}
        </Card>
      </div>
    </>
  );
}
