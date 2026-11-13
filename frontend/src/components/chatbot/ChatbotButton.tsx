import { MessageCircleMore } from "lucide-react"

type ChatbotButtonProps = {
  open: boolean
  onClick: () => void
}

export default function ChatbotButton({ open, onClick }: ChatbotButtonProps) {
  return (
    <button
      type="button"
      aria-label={open ? "Close FitLab AI chat" : "Open FitLab AI chat"}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={onClick}
      className="fixed right-4 bottom-4 z-40 flex size-15 items-center justify-center rounded-full bg-primary bg-fl-banner text-white shadow-[0_12px_28px_-12px_rgb(18_56_201/0.6)] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] [@media(hover:hover)]:hover:scale-[1.03] [@media(hover:hover)]:hover:shadow-[0_16px_34px_-12px_rgb(18_56_201/0.7)] focus-visible:scale-[1.03] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/35 active:scale-[0.97] sm:right-6 sm:bottom-6"
    >
      <MessageCircleMore className="size-6" />
    </button>
  )
}
