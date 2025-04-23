import { Router } from "express";
import {
  getChatHistory,
  createChat,
  sendMessage,
  editChatTitle,
  deleteChat,
  extractTravelPreferences,
} from "../controllers/chat.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticateToken);

router.get("/", getChatHistory);
router.post("/", createChat);
router.post("/message", sendMessage);
router.put("/edit/:chatId", editChatTitle);
router.delete("/delete/:chatId", deleteChat);
router.post("/extract", extractTravelPreferences);

export default router;
