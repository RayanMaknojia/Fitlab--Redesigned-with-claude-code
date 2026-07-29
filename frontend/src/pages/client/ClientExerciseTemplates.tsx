import DialogFormButton from "@/components/client/DialogFormButton";
import ExerciseTemplateCard from "@/components/client/ExerciseTemplateCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useEffect, useState } from "react";

export default function ClientExerciseTemplates() {
  const [templates, setTemplates] = useState<ExerciseTemplate[]>([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [newTemplateName, setNewTemplateName] = useState("");

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

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();

    try {
      const newTemplate = await addExerciseTemplate(
        user?.id as string,
        newTemplateName,
      );
      setTemplates([...templates, newTemplate]);
    } catch (e: unknown) {
      displayError(e instanceof Error ? e.message : "Could not add template.");
    } finally {
      setNewTemplateName("");
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
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Your Templates
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reuse these exercise names for your session exercises.
          </p>
        </div>
        <DialogFormButton
          dialogTriggerButton={
            <Button className="bg-lime-400 font-semibold text-black hover:bg-lime-300 w-max">
              Add a template
            </Button>
          }
          dialogHeaderText="Add a template"
          submitButtonText="Add template"
          closeButtonText="Cancel"
          handleSubmit={handleSubmit}
        >
          <FieldGroup>
            <Field>
              <Label htmlFor="name-1" className="text-white">
                Name
              </Label>
              <Input
                id="name-1"
                name="name"
                className="text-white"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
              />
            </Field>
          </FieldGroup>
        </DialogFormButton>
        <Card className="border-border/60 bg-card/60 py-5 backdrop-blur p-6 flex">
          {loading ? (
            <div className="h-64 animate-pulse rounded-lg bg-muted/40" />
          ) : templates.length > 0 ? (
            templates.map((t) => (
              <ExerciseTemplateCard
                t={t}
                key={t._id}
                handleDeleteTemplate={handleDeleteTemplate}
                handleEditTemplate={handleEditTemplate}
              />
            ))
          ) : (
            <p>No templates yet.</p>
          )}
        </Card>
        <Toaster />
      </div>
    </>
  );
}
