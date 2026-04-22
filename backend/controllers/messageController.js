import { liveDB as db } from "../db.js";
import { io } from "../server.js";

export const sendMessage = async (req, res) => {
    try {
        const { pairId, senderId, message, deliverAt } = req.body;
        console.log("sendMessage payload:", { pairId, senderId, message, deliverAt });

        if (!pairId || !senderId || !message) {
            return res.status(400).json({ status: "error", message: "Missing required fields" });
        }

        let isDelayed = false;
        if (deliverAt) {
            isDelayed = true;
        }

        let formattedTime = null;
        if (deliverAt) {
            formattedTime = deliverAt.replace("T", " ");
            if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(formattedTime)) {
                formattedTime = `${formattedTime}:00`;
            }
        }

        const [result] = await db.query(
            `INSERT INTO messages 
            (pair_id, sender_id, message, status, is_delayed, deliver_at) 
            VALUES (?, ?, ?, 'sent', ?, ?)`,
            [pairId, senderId, message, isDelayed, formattedTime]
        );

        // 🔥 Only emit if NOT delayed
        if (!isDelayed) {
            io.to(pairId).emit("receiveMessage", {
                senderId,
                message
            });
        }

        res.json({ status: "success", id: result.insertId });

    } catch (err) {
        res.status(500).json({ status: "error" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { pairId } = req.params;
        const { userId } = req.query;

        const [rows] = await db.query(
            "SELECT * FROM messages WHERE pair_id=? AND (is_delayed=0 OR sender_id=?) ORDER BY created_at ASC",
            [pairId, userId || 0]
        );

        res.json(rows);

    } catch (err) {
        res.status(500).json({ status: "error" });
    }
};

export const cancelScheduledMessage = async (req, res) => {
    try {
        const { messageId, senderId } = req.body;
        await db.query(
            "DELETE FROM messages WHERE id=? AND sender_id=? AND is_delayed=1",
            [messageId, senderId]
        );
        res.json({ status: "success" });
    } catch (err) {
        res.status(500).json({ status: "error" });
    }
};

export const editScheduledMessage = async (req, res) => {
    try {
        const { messageId, senderId, message, deliverAt } = req.body;
        let formattedTime = null;
        if (deliverAt) {
            formattedTime = deliverAt.replace("T", " ");
            if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(formattedTime)) {
                formattedTime = `${formattedTime}:00`;
            }
        }

        await db.query(
            "UPDATE messages SET message=?, deliver_at=? WHERE id=? AND sender_id=? AND is_delayed=1",
            [message, formattedTime, messageId, senderId]
        );

        res.json({ status: "success" });
    } catch (err) {
        res.status(500).json({ status: "error" });
    }
};

export const markDelivered = async (req, res) => {
    const { pairId, userId } = req.body;

    await db.query(
        "UPDATE messages SET status='delivered' WHERE pair_id=? AND sender_id != ? AND status='sent'",
        [pairId, userId]
    );

    res.json({ status: "ok" });
};

export const markSeen = async (req, res) => {
    const { pairId, userId } = req.body;

    await db.query(
        "UPDATE messages SET status='seen', seen_at=NOW() WHERE pair_id=? AND sender_id != ?",
        [pairId, userId]
    );

    res.json({ status: "ok" });
};

export const sendMedia = async (req, res) => {
    try {
        const { pairId, senderId } = req.body;
        const filePath = req.file?.filename;

        if (!pairId || !senderId) {
            return res.status(400).json({ status: "error", message: "pairId and senderId are required" });
        }

        if (!filePath) {
            return res.status(400).json({ status: "error", message: "A media file is required" });
        }

        await db.query(
            "INSERT INTO messages (pair_id, sender_id, media_url, status) VALUES (?, ?, ?, 'sent')",
            [pairId, senderId, filePath]
        );

        // socket emit
        io.to(pairId).emit("receiveMedia", {
            senderId,
            media: filePath
        });

        res.json({ status: "success", mediaUrl: filePath });

    } catch (err) {
        console.error("SEND MEDIA ERROR:", err);
        res.status(500).json({ status: "error", message: "Unable to upload media" });
    }
};

export const addReaction = async (req, res) => {
    try {
        const { messageId, reaction } = req.body;

        await db.query(
            "UPDATE messages SET reaction=? WHERE id=?",
            [reaction, messageId]
        );

        // socket update
        io.emit("reactionUpdated", { messageId, reaction });

        res.json({ status: "success" });

    } catch (err) {
        res.status(500).json({ status: "error" });
    }
};
