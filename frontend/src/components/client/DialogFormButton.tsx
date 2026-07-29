import type { ReactNode, ReactPortal } from "react";
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
  handleSubmit,
}: {
  dialogTriggerButton: ReactNode;
  dialogHeaderText: string;
  children: ReactNode;
  submitButtonText: string;
  closeButtonText: string;
  handleSubmit: (e: React.SubmitEvent) => Promise<void>;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{dialogTriggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-sm dark">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader className="text-white">
            <DialogTitle>{dialogHeaderText}</DialogTitle>
          </DialogHeader>
          {children}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="text-white">
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
