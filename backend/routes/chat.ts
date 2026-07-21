import express from "express";

import { createChatReply } from "../controllers/chatController";
import { chatRateLimit } from "../middleware/chatRateLimit";
import { requireAuth } from "../middleware/requireAuth";

export const chatRouter = express.Router();

chatRouter.post("/chat", requireAuth, chatRateLimit, createChatReply);
