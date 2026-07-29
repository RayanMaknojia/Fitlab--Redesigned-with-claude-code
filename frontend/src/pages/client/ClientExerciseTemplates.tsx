import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { addExerciseTemplate, getExerciseTemplates } from "@/lib/clientApi";
import type { ExerciseTemplate } from "@/types/client";
import { useEffect, useState } from "react";

export default function ClientExerciseTemplates() {
  const [templates, setTemplates] = useState<ExerciseTemplate[]>([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTemplateName, setNewTemplateName] = useState("");

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

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();

    try {
      const newTemplate = await addExerciseTemplate(
        user?.id as string,
        newTemplateName,
      );
      setTemplates([...templates, newTemplate]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not add template.");
    } finally {
      setNewTemplateName("");
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
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-lime-400 font-semibold text-black hover:bg-lime-300 w-max">
              Add a template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm dark">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <DialogHeader className="text-white">
                <DialogTitle>Add a template</DialogTitle>
              </DialogHeader>
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
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" className="text-white">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit">Add template</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
