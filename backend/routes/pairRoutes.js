import express from "express";
import {
    getConnectionStatus,
    searchUsers,
    sendPairRequest,
    getRequests,
    acceptRequest,
    rejectRequest
} from "../controllers/pairController.js";

const router = express.Router();

router.get("/status/:userId", getConnectionStatus);
router.get("/search", searchUsers);
router.post("/request", sendPairRequest);

router.get("/requests/:userId", getRequests);
router.post("/accept-request", acceptRequest);
router.post("/reject-request", rejectRequest);

export default router;