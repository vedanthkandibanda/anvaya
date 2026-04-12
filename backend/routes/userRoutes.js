import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { profileSetup, getUserProfile, updateUserProfile } from "../controllers/userController.js";

const router = express.Router();

router.get("/profile/:userId", getUserProfile);
router.post("/profile-setup", upload.single("profilePic"), profileSetup);
router.post("/profile-update", upload.single("profilePic"), updateUserProfile);

export default router;