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
      className="fixed right-4 bottom-4 z-40 flex size-15 items-center justify-center rounded-full border border-lime-300/30 bg-[linear-gradient(135deg,oklch(0.78_0.19_134),oklch(0.7_0.2_160))] text-black shadow-[0_18px_40px_-18px_oklch(0.78_0.19_134/0.85)] transition-transform duration-200 hover:scale-[1.03] hover:shadow-[0_24px_50px_-20px_oklch(0.8_0.18_140/0.95)] focus-visible:scale-[1.03] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lime-300/35 active:scale-[0.97] sm:right-6 sm:bottom-6"
    >
      <MessageCircleMore className="size-6" />
    </button>
  )
}
