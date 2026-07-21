import { Request, Response } from "express";

type ChatMessageInput = {
  message?: string;
};

export const getChatHealth = async (_req: Request, res: Response) => { // Just to check if the chat route is mounted correctly 
  res.json({ status: "chat endpoint OK" });                         // when frontend sends request to /api/chat/health
};

export const sendChatMessage = async (
  req: Request<unknown, unknown, ChatMessageInput>,
  res: Response,
) => {
  const message = req.body.message?.trim();

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  // Placeholder for future integration
  res.json({
    message,
    reply: "Chatbot endpoint wired",
  });
};
