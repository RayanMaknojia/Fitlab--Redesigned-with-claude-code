import { Request, Response } from "express"

import { generateAIResponse } from "../services/aiService"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

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

  const validMessages = messages.every(
    (message): message is ChatMessage =>
      message &&
      (message.role === "user" || message.role === "assistant") &&
      typeof message.content === "string" &&
      message.content.trim().length > 0
  )

  if (!validMessages) {
    res.status(400).json({
      error: "Each message must include a valid role and non-empty content",
    })
    return
  }

  try {
    const content = await generateAIResponse(messages)

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
