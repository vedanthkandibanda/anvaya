import { liveDB as db } from "../db.js";
import { io } from "../server.js";

/* 🌅 DAILY MESSAGE */
export const saveDailyMessage = async (req, res) => {
    try {
        const { pairId, message } = req.body;

        if (!pairId || !message?.trim()) {
            return res.status(400).json({ status: "error", message: "pairId and message are required" });
        }

        const [existing] = await db.query(
            "SELECT id FROM daily_messages WHERE pair_id=? AND date=CURDATE() LIMIT 1",
            [pairId]
        );

        if (existing.length > 0) {
            await db.query(
                "UPDATE daily_messages SET message=? WHERE id=?",
                [message.trim(), existing[0].id]
            );
        } else {
            await db.query(
                "INSERT INTO daily_messages (pair_id, message, date) VALUES (?, ?, CURDATE())",
                [pairId, message.trim()]
            );
        }

        res.json({ status: "success" });
    } catch (err) {
        console.error("SAVE DAILY MESSAGE ERROR:", err);
        res.status(500).json({ status: "error", message: "Unable to save daily message" });
    }
};

export const getDailyMessage = async (req, res) => {
    try {
        const { pairId } = req.params;

        const [rows] = await db.query(
            "SELECT * FROM daily_messages WHERE pair_id=? AND date=CURDATE()",
            [pairId]
        );

        res.json(rows[0] || null);
    } catch (err) {
        console.error("GET DAILY MESSAGE ERROR:", err);
        res.status(500).json({ status: "error", message: "Unable to load daily message" });
    }
};

/* 💞 MEMORIES */
export const addMemory = async (req, res) => {
    try {
        const { pairId, title, description, memory_date } = req.body;

        if (!pairId || !title?.trim() || !memory_date) {
            return res.status(400).json({ status: "error", message: "pairId, title, and memory date are required" });
        }

        await db.query(
            "INSERT INTO memories (pair_id, title, description, memory_date) VALUES (?, ?, ?, ?)",
            [pairId, title.trim(), description?.trim() || null, memory_date]
        );

        res.json({ status: "success" });
    } catch (err) {
        console.error("ADD PROFILE MEMORY ERROR:", err);
        res.status(500).json({ status: "error", message: "Unable to save memory" });
    }
};

export const getMemories = async (req, res) => {
    try {
        const { pairId } = req.params;

        const [rows] = await db.query(
            "SELECT * FROM memories WHERE pair_id=? ORDER BY memory_date DESC",
            [pairId]
        );

        res.json(rows);
    } catch (err) {
        console.error("GET PROFILE MEMORIES ERROR:", err);
        res.status(500).json({ status: "error", message: "Unable to load memories" });
    }
};

/* ❤️ SMART MESSAGE */
export const sendSmartMessage = async (req, res) => {
    try {

        const {
            pairId,
            senderId,
            message,
            deliverAt,
            lockedUntil
        } = req.body;

        if (!pairId || !senderId || !message?.trim()) {
            return res.status(400).json({ status: "error", message: "pairId, senderId, and message are required" });
        }

        const formattedDeliver = deliverAt
            ? deliverAt.replace("T", " ") + ":00"
            : null;

        const formattedLock = lockedUntil
            ? lockedUntil.replace("T", " ") + ":00"
            : null;

        await db.query(
            `INSERT INTO messages 
            (pair_id, sender_id, message, status, deliver_at, locked_until)
            VALUES (?, ?, ?, 'sent', ?, ?)`,
            [pairId, senderId, message.trim(), formattedDeliver, formattedLock]
        );

        if (!formattedDeliver) {
            io.to(pairId).emit("receiveMessage", {
                pair_id: pairId,
                sender_id: senderId,
                message: message.trim(),
                status: "delivered"
            });
        }

        res.json({ status: "ok" });
    } catch (err) {
        console.error("SEND SMART MESSAGE ERROR:", err);
        res.status(500).json({ status: "error", message: "Unable to save smart message" });
    }
};
