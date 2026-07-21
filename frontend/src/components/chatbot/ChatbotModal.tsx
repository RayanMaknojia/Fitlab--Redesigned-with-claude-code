import { useEffect, useRef } from "react"
import { Bot, Sparkles, X } from "lucide-react"

import ChatInput from "@/components/chatbot/ChatInput"
import ChatMessage from "@/components/chatbot/ChatMessage"
import type { ChatMessageData } from "@/components/chatbot/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"

type ChatbotModalProps = {
  open: boolean
  loading: boolean
  draft: string
  messages: ChatMessageData[]
  onOpenChange: (open: boolean) => void
  onDraftChange: (value: string) => void
  onSend: () => void
}

export default function ChatbotModal({
  open,
  loading,
  draft,
  messages,
  onOpenChange,
  onDraftChange,
  onSend,
}: ChatbotModalProps) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return

    messagesEndRef.current?.scrollIntoView({ block: "end" })
  }, [messages, loading, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby="fitlab-ai-description"
        showCloseButton={false}
        className="top-auto left-auto flex h-[100dvh] w-screen translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-white/10 bg-[linear-gradient(180deg,rgba(22,22,22,0.98),rgba(15,15,15,0.98))] p-0 shadow-[0_28px_80px_-32px_rgba(0,0,0,0.9)] sm:right-6 sm:bottom-24 sm:left-auto sm:top-auto sm:h-[min(650px,calc(100dvh-7rem))] sm:w-[min(420px,calc(100vw-3rem))] sm:rounded-[28px]"
      >
        <div className="flex items-start justify-between border-b border-white/10 bg-black/20 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-lime-400/15 text-lime-300 ring-1 ring-lime-300/20">
                <Bot className="size-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="truncate text-base font-semibold text-foreground">
                  FitLab AI
                </DialogTitle>
                <DialogDescription
                  id="fitlab-ai-description"
                  className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <span className="inline-flex size-2 rounded-full bg-lime-300 shadow-[0_0_10px_oklch(0.85_0.19_135/0.95)]" />
                  Online
                </DialogDescription>
              </div>
            </div>
          </div>

          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Close FitLab AI chat"
              className="size-10 rounded-xl text-muted-foreground hover:bg-white/8 hover:text-foreground"
            >
              <X className="size-5" />
            </Button>
          </DialogClose>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <div className="flex min-h-full flex-col gap-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-white/10 bg-white/6 px-4 py-3 text-sm text-muted-foreground backdrop-blur-sm">
                  <Sparkles className="size-4 animate-pulse text-lime-300" />
                  FitLab AI is thinking...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <ChatInput
          value={draft}
          disabled={loading}
          onChange={onDraftChange}
          onSend={onSend}
        />
      </DialogContent>
    </Dialog>
  )
}
