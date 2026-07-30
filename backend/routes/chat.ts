import express from "express";

import {
  createChatReply,
  getChatHealth,
} from "../controllers/chatController";
import { chatRateLimit } from "../middleware/chatRateLimit";
import { requireAuth } from "../middleware/requireAuth";

export const chatRouter = express.Router();

chatRouter.get("/health", getChatHealth);
chatRouter.post("/", requireAuth, chatRateLimit, createChatReply);
