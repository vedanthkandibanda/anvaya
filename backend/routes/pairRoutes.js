import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import {
    getConnectionStatus,
    searchUsers,
    sendPairRequest,
    getRequests,
    acceptRequest,
    rejectRequest,
    disconnectPair,
    getConnectionBackground,
    saveConnectionBackground,
    resetConnectionBackground
} from "../controllers/pairController.js";

const router = express.Router();

router.get("/status/:userId", getConnectionStatus);
router.get("/search", searchUsers);
router.post("/request", sendPairRequest);
router.get("/connection-bg/:pairId", getConnectionBackground);
router.post("/connection-bg", upload.single("image"), saveConnectionBackground);
router.delete("/connection-bg/:pairId", resetConnectionBackground);

router.get("/requests/:userId", getRequests);
router.post("/accept-request", acceptRequest);
router.post("/reject-request", rejectRequest);
router.post("/disconnect", disconnectPair);

export default router;