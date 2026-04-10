import express from "express";
import { sendMessage, getMessages, cancelScheduledMessage, editScheduledMessage, markDelivered, markSeen, sendMedia, addReaction } from "../controllers/messageController.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/send", sendMessage);
router.get("/:pairId", getMessages);
router.post("/schedule/cancel", cancelScheduledMessage);
router.post("/schedule/edit", editScheduledMessage);
router.post("/delivered", markDelivered);
router.post("/seen", markSeen);
router.post("/media", upload.single("file"), sendMedia);
router.post("/react", addReaction);

export default router;