import { Request, Response } from "express"

import { generateAIResponse } from "../services/aiService"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

const MAX_MESSAGE_COUNT = 20
const MAX_MESSAGE_LENGTH = 2000
const MAX_TOTAL_CHARACTERS = 12000

export const createChatReply = async (req: Request, res: Response) => {
  const { messages } = req.body ?? {}

  if (!process.env.GROQ_API_KEY) {
    res.status(500).json({ error: "GROQ_API_KEY is not configured." })
    return
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Messages are required" })
    return
  }

  if (messages.length > MAX_MESSAGE_COUNT) {
    res.status(400).json({
      error: `Too many messages. Limit each request to ${MAX_MESSAGE_COUNT} messages.`,
    })
    return
  }

  const validMessages = messages.every(
    (message): message is ChatMessage =>
      message &&
      (message.role === "user" || message.role === "assistant") &&
      typeof message.content === "string"
  )

  if (!validMessages) {
    res.status(400).json({
      error: "Each message must include a valid role and non-empty content",
    })
    return
  }

  const normalizedMessages = messages.map((message) => ({
    role: message.role,
    content: message.content.trim(),
  }))

  const hasEmptyMessage = normalizedMessages.some(
    (message) => message.content.length === 0
  )

  if (hasEmptyMessage) {
    res.status(400).json({
      error: "Each message must include a valid role and non-empty content",
    })
    return
  }

  const hasTooLongMessage = normalizedMessages.some(
    (message) => message.content.length > MAX_MESSAGE_LENGTH
  )

  if (hasTooLongMessage) {
    res.status(400).json({
      error: `Each message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`,
    })
    return
  }

  const totalCharacters = normalizedMessages.reduce(
    (sum, message) => sum + message.content.length,
    0
  )

  if (totalCharacters > MAX_TOTAL_CHARACTERS) {
    res.status(400).json({
      error: `Conversation is too large. Limit each request to ${MAX_TOTAL_CHARACTERS} total characters.`,
    })
    return
  }

  try {
    const content = await generateAIResponse(normalizedMessages)

    res.json({
      message: {
        role: "assistant",
        content,
      },
    })
    return
  } catch (error) {
    console.error("Chat API error:", error)

    if (error instanceof Error) {
      if (
        error.message.toLowerCase().includes("rate limit") ||
        error.message.includes("429")
      ) {
        res.status(429).json({
          error: "The chatbot request limit was reached. Try again shortly.",
        })
        return
      }

      res.status(502).json({ error: error.message })
      return
    }

    res.status(500).json({ error: "Failed to generate reply" })
  }
}
