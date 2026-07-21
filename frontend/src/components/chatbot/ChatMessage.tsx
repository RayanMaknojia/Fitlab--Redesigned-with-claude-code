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
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
          isUser
            ? "rounded-br-md bg-lime-400 text-black"
            : "rounded-bl-md border border-white/10 bg-white/6 text-white backdrop-blur-sm"
        )}
      >
        {message.content}
      </div>
    </div>
  )
}
