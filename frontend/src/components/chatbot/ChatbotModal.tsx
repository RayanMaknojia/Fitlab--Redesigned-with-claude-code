import { useEffect, useRef } from "react"
import { Bot, Sparkles, X } from "lucide-react"

import ChatInput from "@/components/chatbot/ChatInput"
import ChatMessage from "@/components/chatbot/ChatMessage"
import type { ChatMessageData } from "@/types/chatbot"
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
  maxLength: number
  messages: ChatMessageData[]
  onOpenChange: (open: boolean) => void
  onDraftChange: (value: string) => void
  onSend: () => void
}

export default function ChatbotModal({
  open,
  loading,
  draft,
  maxLength,
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
        className="top-auto left-auto flex h-[100dvh] w-screen translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-border bg-card p-0 shadow-[0_24px_60px_-24px_rgb(11_21_48/0.35)] sm:right-6 sm:bottom-24 sm:left-auto sm:top-auto sm:h-[min(700px,calc(100dvh-6rem))] sm:w-[min(460px,calc(100vw-3rem))] sm:rounded-[28px]"
      >
        <div className="flex items-start justify-between border-b border-border bg-muted/50 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-primary ring-1 ring-primary/20">
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
                  <span className="inline-flex size-2 rounded-full bg-emerald-500" />
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
              className="size-10 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
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
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-border bg-muted px-4 py-3 text-sm text-foreground">
                  <Sparkles className="size-4 animate-pulse text-primary" />
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
          maxLength={maxLength}
          onChange={onDraftChange}
          onSend={onSend}
        />
      </DialogContent>
    </Dialog>
  )
}
