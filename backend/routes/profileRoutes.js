import express from "express";
import {
    saveDailyMessage,
    getDailyMessage,
    addMemory,
    getMemories,
    sendSmartMessage
} from "../controllers/profileController.js";

const router = express.Router();

router.post("/daily", saveDailyMessage);
router.get("/daily/:pairId", getDailyMessage);

router.post("/memory", addMemory);
router.get("/memory/:pairId", getMemories);

router.post("/smart", sendSmartMessage);

export default router;