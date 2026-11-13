import type { ReactNode } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";

export default function DialogFormButton({
  dialogTriggerButton,
  dialogHeaderText,
  children,
  submitButtonText,
  closeButtonText,
  modal = true,
  handleSubmit,
}: {
  dialogTriggerButton: ReactNode;
  dialogHeaderText: string;
  children: ReactNode;
  submitButtonText: string;
  closeButtonText: string;
  modal?: boolean;
  handleSubmit: (e: React.SubmitEvent) => Promise<void>;
}) {
  return (
    <Dialog modal={modal}>
      <DialogTrigger asChild>{dialogTriggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader className="text-foreground">
            <DialogTitle>{dialogHeaderText}</DialogTitle>
          </DialogHeader>
          {children}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="text-foreground">
                {closeButtonText}
              </Button>
            </DialogClose>
            <Button type="submit">{submitButtonText}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
