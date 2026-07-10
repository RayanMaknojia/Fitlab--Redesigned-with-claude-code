import express from "express";
import { getChatHealth, sendChatMessage } from "../controllers/chatController";

export const chatRouter = express.Router();

chatRouter.get("/health", getChatHealth); // Server check endpoint
chatRouter.post("/", sendChatMessage);
