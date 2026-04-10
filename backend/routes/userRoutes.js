import express from "express";
import { profileSetup } from "../controllers/userController.js";

const router = express.Router();

router.post("/profile-setup", profileSetup);

export default router;