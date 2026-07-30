import type { ChatRequestMessage } from "@/types/chatbot"

import { request } from "@/lib/request"

export interface ChatResponse {
  message: {
    role: "assistant"
    content: string
  }
}

// Chat-specific backend actions live here 
export const chatApi = {
  chat: (input: { messages: ChatRequestMessage[] }) =>
    request<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify(input),
    }),
}
