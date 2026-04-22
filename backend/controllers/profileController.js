import { liveDB as db } from "../db.js";
import { io } from "../server.js";

/* 🌅 DAILY MESSAGE */
export const saveDailyMessage = async (req, res) => {
    const { pairId, message } = req.body;

    await db.query(
        "INSERT INTO daily_messages (pair_id, message, date) VALUES (?, ?, CURDATE())",
        [pairId, message]
    );

    res.json({ status: "success" });
};

export const getDailyMessage = async (req, res) => {
    const { pairId } = req.params;

    const [rows] = await db.query(
        "SELECT * FROM daily_messages WHERE pair_id=? AND date=CURDATE()",
        [pairId]
    );

    res.json(rows[0] || null);
};

/* 💞 MEMORIES */
export const addMemory = async (req, res) => {
    const { pairId, title, description, memory_date } = req.body;

    await db.query(
        "INSERT INTO memories (pair_id, title, description, memory_date) VALUES (?, ?, ?, ?)",
        [pairId, title, description, memory_date]
    );

    res.json({ status: "success" });
};

export const getMemories = async (req, res) => {
    const { pairId } = req.params;

    const [rows] = await db.query(
        "SELECT * FROM memories WHERE pair_id=? ORDER BY memory_date DESC",
        [pairId]
    );

    res.json(rows);
};

/* ❤️ SMART MESSAGE */
export const sendSmartMessage = async (req, res) => {

    const {
        pairId,
        senderId,
        message,
        deliverAt,
        lockedUntil
    } = req.body;

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
        [pairId, senderId, message, formattedDeliver, formattedLock]
    );

    // if no delay → send immediately
    if (!formattedDeliver) {
        io.to(pairId).emit("receiveMessage", {
            pair_id: pairId,
            sender_id: senderId,
            message,
            status: "delivered"
        });
    }

    res.json({ status: "ok" });
};
