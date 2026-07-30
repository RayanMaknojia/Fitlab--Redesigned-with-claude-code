import { toast } from "sonner";

export default function displayError(error: string) {
  toast.error("Error", {
    description: error,
    action: {
      label: "Close",
      onClick: () => {},
    },
    position: "top-center",
  });
}
