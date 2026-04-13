import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { uploadSong, getSongs } from "../controllers/musicController.js";

const router = express.Router();

router.post("/upload", upload.single("file"), uploadSong);
router.get("/:pairId", getSongs);

export default router;