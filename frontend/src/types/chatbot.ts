export type ChatRole = "assistant" | "user"

export type ChatMessageData = {
  id: string
  role: ChatRole
  content: string
}

export type ChatRequestMessage = {
  role: ChatRole
  content: string
}
