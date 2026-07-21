import { useState } from "react"
import { chatApi } from "@/lib/chatApi"

import ChatbotButton from "@/components/chatbot/ChatbotButton"
import ChatbotModal from "@/components/chatbot/ChatbotModal"
import type { ChatMessageData, ChatRequestMessage } from "@/types/chatbot"

const WELCOME_MESSAGE: ChatMessageData = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi, I'm FitLab AI. Ask me about your workouts, progress, recovery, or fitness goals.",
}



export default function AuthenticatedChatbot() {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessageData[]>([WELCOME_MESSAGE])

  async function handleSend() {
    const content = draft.trim()

    if (!content || loading) return // Prevents double sending or blank messages

    const userMessage: ChatMessageData = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
    }
    const nextMessages = [...messages, userMessage]; // Current chat history + new message
    const requestMessages: ChatRequestMessage[] = nextMessages.map(
      ({role, content}) =>({role, content})
    );
    setMessages(nextMessages)
    setDraft("")
    setLoading(true)

    try {
      const {message} = await chatApi.chat({messages: requestMessages})

      const aiReply: ChatMessageData = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: message.content,
      }

      setMessages((current) => [...current, aiReply])
    } catch (error) {
      const errorReply: ChatMessageData = {
        id: `assistant-error-${Date.now()}`,
        role: "assistant",
        content:
          error instanceof Error
            ? `Sorry, I couldn't get a response right now: ${error.message}`
            : "Sorry, I couldn't get a response right now.",
      }

      setMessages((current) => [...current, errorReply])
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
