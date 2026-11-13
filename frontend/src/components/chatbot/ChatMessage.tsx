import { cn } from "@/lib/utils"
import type { ChatMessageData } from "@/types/chatbot"

type ChatMessageProps = {
  message: ChatMessageData
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
          isUser
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md border border-border bg-muted text-foreground"
        )}
      >
        {message.content}
      </div>
    </div>
  )
}
