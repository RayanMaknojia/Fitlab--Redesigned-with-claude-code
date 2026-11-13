import type { ExerciseTemplate } from "@/types/client";
import { Item, ItemActions, ItemContent, ItemTitle } from "../ui/item";
import DialogFormButton from "./DialogFormButton";
import { Button } from "../ui/button";
import { Field, FieldGroup } from "../ui/field";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

export default function ExerciseTemplateCard({
  t,
  handleEditTemplate,
  handleDeleteTemplate,
}: {
  t: ExerciseTemplate;
  handleEditTemplate: (e: React.SubmitEvent, _id: string) => Promise<void>;
  handleDeleteTemplate: (_id: string) => Promise<void>;
}) {
  return (
    <Item className="rounded-lg transition-colors [@media(hover:hover)]:hover:bg-muted/60">
      <ItemContent>
        <ItemTitle className="font-medium">{t.name}</ItemTitle>
      </ItemContent>
      <ItemActions>
        <DialogFormButton
          dialogTriggerButton={
            <Button size="sm" variant="outline">
              Edit
            </Button>
          }
          dialogHeaderText="Edit this template"
          submitButtonText="Finish editing"
          closeButtonText="Cancel"
          handleSubmit={async (e) => await handleEditTemplate(e, t._id)}
        >
          <FieldGroup>
            <Field>
              <Label htmlFor="new-name" className="text-foreground">
                Name
              </Label>
              <Input id="new-name" name="new-name" className="text-foreground" defaultValue={t.name} required />
            </Field>
          </FieldGroup>
        </DialogFormButton>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => handleDeleteTemplate(t._id)}
        >
          Delete
        </Button>
      </ItemActions>
    </Item>
  );
}
