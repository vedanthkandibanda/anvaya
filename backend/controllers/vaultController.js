import db from "../config/dbConfig.js";

/* ➕ ADD MEMORY */
export const addMemory = async (req, res) => {
    try {
        const { pairId, type, title, description, memory_date, file_url } = req.body;

        if (!pairId || !type || !title || !memory_date) {
            return res.status(400).json({ status: "error", message: "Missing required fields" });
        }

        const finalFileUrl = file_url || (req.file ? req.file.filename : null);

        await db.query(
            "INSERT INTO vault (pair_id, type, title, description, memory_date, file_url) VALUES (?, ?, ?, ?, ?, ?)",
            [pairId, type, title, description || null, memory_date, finalFileUrl]
        );

        res.json({ status: "success" });
    } catch (err) {
        console.error("ADD VAULT MEMORY ERROR:", err);
        res.status(500).json({ status: "error", message: "Unable to save memory" });
    }
};

/* 📥 GET MEMORIES */
export const getMemories = async (req, res) => {
    try {
        const { pairId } = req.params;

        const [rows] = await db.query(
            "SELECT * FROM vault WHERE pair_id=? ORDER BY memory_date DESC",
            [pairId]
        );

        res.json(rows);
    } catch (err) {
        console.error("GET VAULT MEMORIES ERROR:", err);
        res.status(500).json({ status: "error", message: "Unable to load memories" });
    }
};

/* ❌ DELETE */
export const deleteMemory = async (req, res) => {
    try {
        const { id } = req.params;

        await db.query("DELETE FROM vault WHERE id=?", [id]);

        res.json({ status: "deleted" });
    } catch (err) {
        console.error("DELETE VAULT MEMORY ERROR:", err);
        res.status(500).json({ status: "error", message: "Unable to delete memory" });
    }
};

/* ✏️ UPDATE */
export const updateMemory = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, type, memory_date } = req.body;

        const [existingRows] = await db.query(
            "SELECT type, memory_date, file_url FROM vault WHERE id=?",
            [id]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({ status: "error", message: "Memory not found" });
        }

        const existing = existingRows[0];
        const nextType = type || existing.type;
        const nextDate = memory_date || existing.memory_date;
        const nextFileUrl = req.file ? req.file.filename : existing.file_url;

        await db.query(
            "UPDATE vault SET type=?, title=?, description=?, memory_date=?, file_url=? WHERE id=?",
            [nextType, title, description, nextDate, nextFileUrl, id]
        );

        res.json({ status: "updated" });
    } catch (err) {
        console.error("UPDATE VAULT MEMORY ERROR:", err);
        res.status(500).json({ status: "error", message: "Unable to update memory" });
    }
};