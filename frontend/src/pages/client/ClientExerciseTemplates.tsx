import { Card } from "@/components/ui/card";
import type { ExerciseTemplate } from "@/types/client";
import { useState } from "react";

export default function ClientExerciseTemplates() {
  const [templates, setTemplates] = useState<ExerciseTemplate[]>([]);

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
        <Card className="border-border/60 bg-card/60 py-5 backdrop-blur p-6 flex">
          {templates.length > 0 ? (
            templates.map((t) => <p key={t._id}>{t.name}</p>)
          ) : (
            <p>No templates yet.</p>
          )}
        </Card>
      </div>
    </>
  );
}
