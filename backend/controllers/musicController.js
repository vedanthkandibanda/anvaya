import db from "../config/dbConfig.js";

/* UPLOAD */
export const uploadSong = async (req, res) => {
    try {
        const { pairId, name } = req.body || {};

        if (!pairId || !name) {
            return res.status(400).json({ message: "pairId and name are required" });
        }

        if (!req.file) {
            return res.status(400).json({ message: "Song file is required" });
        }

        if (!req.file.mimetype || !req.file.mimetype.startsWith("audio/")) {
            return res.status(400).json({ message: "Only audio files are allowed" });
        }

        const file_url = req.file.filename;

        await db.query(
            "INSERT INTO songs (pair_id, name, file_url) VALUES (?, ?, ?)",
            [pairId, name, file_url]
        );

        return res.json({ status: "uploaded" });
    } catch (error) {
        console.error("UPLOAD SONG ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

/* GET SONGS */
export const getSongs = async (req, res) => {
    try {
        const { pairId } = req.params;

        if (!pairId) {
            return res.status(400).json({ message: "pairId required" });
        }

        const [rows] = await db.query(
            "SELECT * FROM songs WHERE pair_id=? ORDER BY id DESC",
            [pairId]
        );

        return res.json(rows);
    } catch (error) {
        console.error("GET SONGS ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};