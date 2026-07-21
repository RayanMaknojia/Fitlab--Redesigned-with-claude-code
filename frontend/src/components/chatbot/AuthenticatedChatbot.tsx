import { useState } from "react"

import ChatbotButton from "@/components/chatbot/ChatbotButton"
import ChatbotModal from "@/components/chatbot/ChatbotModal"
import type { ChatMessageData } from "@/components/chatbot/types"

const WELCOME_MESSAGE: ChatMessageData = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi, I'm FitLab AI. Ask me about your workouts, progress, recovery, or fitness goals.",
}

const MOCK_RESPONSES = [
  "A solid next step is to pair strength work with a recovery day so your weekly volume stays sustainable.",
  "If energy is dropping mid-week, reduce intensity for one session and prioritize sleep, hydration, and protein.",
  "For steady progress, track how hard the session felt along with reps or distance so you can spot plateaus early.",
  "If your goal is muscle gain, aim for progressive overload and keep recovery habits consistent between workouts.",
]

function buildMockReply(prompt: string) {
  const normalized = prompt.trim().toLowerCase()

  if (normalized.includes("recovery")) {
    return "Recovery improves when you keep easy days easy, sleep 7 to 9 hours, and avoid stacking max-effort sessions back to back."
  }

  if (normalized.includes("goal") || normalized.includes("progress")) {
    return "Pick one measurable target for the next two weeks, then review volume, consistency, and recovery before changing the full plan."
  }

  return MOCK_RESPONSES[prompt.length % MOCK_RESPONSES.length]
}

export default function AuthenticatedChatbot() {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessageData[]>([WELCOME_MESSAGE])

  async function handleSend() {
    const content = draft.trim()

    if (!content || loading) return

    const userMessage: ChatMessageData = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
    }

    setMessages((current) => [...current, userMessage])
    setDraft("")
    setLoading(true)

    try {
      // Placeholder async boundary so the UI can be tested before a real AI API exists.
      await new Promise((resolve) => window.setTimeout(resolve, 900))

      const assistantMessage: ChatMessageData = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: buildMockReply(content),
      }

      setMessages((current) => [...current, assistantMessage])
    } finally {
      setLoading(false)
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen((current) => {
      if (current === nextOpen) return current
      return nextOpen
    })
  }

  return (
    <>
      <ChatbotButton open={open} onClick={() => handleOpenChange(!open)} />
      <ChatbotModal
        open={open}
        loading={loading}
        draft={draft}
        messages={messages}
        onOpenChange={handleOpenChange}
        onDraftChange={setDraft}
        onSend={handleSend}
      />
    </>
  )
}
