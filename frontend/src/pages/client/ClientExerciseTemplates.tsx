import ExerciseTemplateCard from "@/components/client/ExerciseTemplateCard";
import AddTemplatesDialog from "@/components/client/templates/AddTemplatesDialog";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/context/AuthContext";
import {
  addExerciseTemplate,
  deleteExerciseTemplate,
  getExerciseTemplates,
  updateExerciseTemplate,
} from "@/lib/clientApi";
import displayError from "@/lib/displayError";
import type { ExerciseTemplate } from "@/types/client";
import { useEffect, useMemo, useState } from "react";
import { normalizeName } from "@/lib/workoutPresets";

export default function ClientExerciseTemplates() {
  const [templates, setTemplates] = useState<ExerciseTemplate[]>([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const ownedNames = useMemo(
    () => new Set(templates.map((t) => normalizeName(t.name))),
    [templates],
  );

  useEffect(() => {
    async function getTemplatesForClient() {
      try {
        setTemplates(await getExerciseTemplates(user?.id as string));
      } catch (e: unknown) {
        displayError(
          e instanceof Error ? e.message : "Could not fetch templates.",
        );
      } finally {
        setLoading(false);
      }
    }

    getTemplatesForClient();
  }, [user?.id]);

  // Creates one template per name (names arrive de-duplicated from the dialog).
  const handleCreate = async (names: string[]) => {
    const created: ExerciseTemplate[] = [];
    try {
      for (const name of names) {
        created.push(await addExerciseTemplate(user?.id as string, name));
      }
    } catch (e: unknown) {
      displayError(e instanceof Error ? e.message : "Could not add template.");
    } finally {
      if (created.length) setTemplates((prev) => [...prev, ...created]);
    }
  };

  const handleEditTemplate = async (e: React.SubmitEvent, _id: string) => {
    e.preventDefault();
    const formData = new FormData(
      (e as React.SubmitEvent<HTMLFormElement>).currentTarget,
    );

    const name = formData.get("new-name")?.valueOf();
    try {
      const newTemplate = await updateExerciseTemplate(_id, name as string);
      newTemplate._id = _id;
      setTemplates(templates.map((t) => (t._id === _id ? newTemplate : t)));
    } catch (e: unknown) {
      displayError(e instanceof Error ? e.message : "Could not edit template.");
    }
  };

  const handleDeleteTemplate = async (_id: string) => {
    try {
      await deleteExerciseTemplate(_id);
      setTemplates(templates.filter((t) => t._id !== _id));
    } catch (e: unknown) {
      displayError(
        e instanceof Error ? e.message : "Could not delete template.",
      );
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Exercise templates
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              The exercises you can log in your sessions. Start from popular
              exercises or a full workout.
            </p>
          </div>
          <AddTemplatesDialog ownedNames={ownedNames} onCreate={handleCreate} />
        </div>
        <section className="rounded-xl border border-border bg-card p-2 shadow-[0_1px_2px_rgb(11_21_48/0.04)]">
          {loading ? (
            <div className="flex flex-col gap-2 p-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : templates.length > 0 ? (
            <ul className="grid animate-fade-in gap-1 sm:grid-cols-2">
              {templates.map((t) => (
                <li key={t._id} data-testid="template-row">
                  <ExerciseTemplateCard
                    t={t}
                    handleDeleteTemplate={handleDeleteTemplate}
                    handleEditTemplate={handleEditTemplate}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <p className="font-medium">No templates yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Use “Add a template” to pick popular exercises or a whole workout,
                like Chest Day or a Yoga Flow.
              </p>
            </div>
          )}
        </section>
        <Toaster />
      </div>
    </>
  );
}
