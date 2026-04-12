import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import {
    addMemory,
    getMemories,
    deleteMemory,
    updateMemory
} from "../controllers/vaultController.js";


const router = express.Router();

router.post("/", upload.single("file"), addMemory);
router.get("/:pairId", getMemories);
router.delete("/:id", deleteMemory);
router.put("/:id", upload.single("file"), updateMemory);

export default router;
