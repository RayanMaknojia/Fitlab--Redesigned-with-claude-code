import express from "express";

import { createChatReply } from "../controllers/chatController";
import { requireAuth } from "../middleware/requireAuth";

export const chatRouter = express.Router();

chatRouter.post("/chat", requireAuth, createChatReply);
