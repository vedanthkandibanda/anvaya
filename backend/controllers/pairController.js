import db from "../db.js";

export const getConnectionStatus = async (req, res) => {
    try {
        const userId = req.params.userId;

        const [pairs] = await db.execute(
            `SELECT * FROM pairs 
             WHERE user_one = ? OR user_two = ?`,
            [userId, userId]
        );

        if (pairs.length === 0) {
            return res.json({
                isConnected: false
            });
        }

        const pair = pairs[0];

        const partnerId =
            pair.user_one == userId
                ? pair.user_two
                : pair.user_one;

        const [users] = await db.execute(
            `SELECT username FROM users WHERE id = ?`,
            [partnerId]
        );

        res.json({
            isConnected: true,
            partnerName: users[0].username,
            pairId: pair.id
        });

    } catch (err) {
        console.log("PAIR STATUS ERROR:", err);

        res.status(500).json({
            message: "Server error"
        });
    }
};

export const searchUsers = async (req, res) => {
    try {
        const { query, userId } = req.query;

        const [users] = await db.execute(
            `SELECT id, username 
             FROM users
             WHERE (username LIKE ? OR email LIKE ?)
             AND id != ?`,
            [`%${query}%`, `%${query}%`, userId]
        );

        res.json(users);

    } catch (err) {
        console.log("SEARCH USERS ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
};

export const sendPairRequest = async (req, res) => {
    try {
        const { senderId, receiverId } = req.body;

        /* CHECK sender already paired */
        const [senderPair] = await db.execute(
            `SELECT * FROM pairs
             WHERE user_one = ? OR user_two = ?`,
            [senderId, senderId]
        );

        if (senderPair.length > 0) {
            return res.json({
                message: "You are already connected ❤️"
            });
        }

        /* CHECK receiver already paired */
        const [receiverPair] = await db.execute(
            `SELECT * FROM pairs
             WHERE user_one = ? OR user_two = ?`,
            [receiverId, receiverId]
        );

        if (receiverPair.length > 0) {
            return res.json({
                message: "User already connected 🔒"
            });
        }

        /* CHECK duplicate request */
        const [existingRequest] = await db.execute(
            `SELECT * FROM pair_requests
             WHERE sender_id = ?
             AND receiver_id = ?
             AND status = 'pending'`,
            [senderId, receiverId]
        );

        if (existingRequest.length > 0) {
            return res.json({
                message: "Request already sent ⏳"
            });
        }

        /* SAVE request */
        await db.execute(
            `INSERT INTO pair_requests
             (sender_id, receiver_id)
             VALUES (?, ?)`,
            [senderId, receiverId]
        );

        res.json({
            message: "Request sent ❤️"
        });

    } catch (err) {
        console.log("PAIR REQUEST ERROR:", err);

        res.status(500).json({
            message: "Server error"
        });
    }
};

export const getRequests = async (req, res) => {
    try {
        const receiverId = req.params.userId;

        const [requests] = await db.execute(
            `SELECT 
                pair_requests.id,
                users.username,
                pair_requests.sender_id
             FROM pair_requests
             JOIN users 
                ON pair_requests.sender_id = users.id
             WHERE receiver_id = ?
             AND status = 'pending'`,
            [receiverId]
        );

        res.json(requests);

    } catch (err) {
        console.log("GET REQUESTS ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
};

export const acceptRequest = async (req, res) => {
    try {
        const { requestId, senderId, receiverId } = req.body;

        /* DOUBLE CHECK sender free */
        const [senderPair] = await db.execute(
            `SELECT * FROM pairs
             WHERE user_one = ? OR user_two = ?`,
            [senderId, senderId]
        );

        /* DOUBLE CHECK receiver free */
        const [receiverPair] = await db.execute(
            `SELECT * FROM pairs
             WHERE user_one = ? OR user_two = ?`,
            [receiverId, receiverId]
        );

        if (senderPair.length > 0 || receiverPair.length > 0) {
            return res.json({
                message: "Connection no longer available"
            });
        }

        /* CREATE pair */
        const [result] = await db.execute(
            `INSERT INTO pairs (user_one, user_two)
             VALUES (?, ?)`,
            [senderId, receiverId]
        );

        const newPairId = result.insertId;

        /* DELETE request */
        await db.execute(
            `DELETE FROM pair_requests
             WHERE id = ?`,
            [requestId]
        );

        res.json({
            status: "success",
            message: "Connected successfully ❤️",
            pairId: newPairId
        });

    } catch (err) {
        console.log("ACCEPT REQUEST ERROR:", err);

        res.status(500).json({
            message: "Server error"
        });
    }
};

export const rejectRequest = async (req, res) => {
    try {
        const { requestId } = req.body;

        await db.execute(
            `DELETE FROM pair_requests
             WHERE id = ?`,
            [requestId]
        );

        res.json({
            message: "Request rejected"
        });

    } catch (err) {
        console.log("REJECT REQUEST ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
};

export const disconnectPair = async (req, res) => {
    try {
        const { pairId, userId } = req.body;

        if (!pairId || !userId) {
            return res.status(400).json({ message: "pairId and userId required" });
        }

        /* Verify user actually belongs to this pair */
        const [pairs] = await db.execute(
            `SELECT * FROM pairs WHERE id = ? AND (user_one = ? OR user_two = ?)`,
            [pairId, userId, userId]
        );

        if (pairs.length === 0) {
            return res.status(403).json({ message: "Not part of this pair" });
        }

        /* Delete all vault memories for this pair */
        await db.execute(`DELETE FROM vault WHERE pair_id = ?`, [pairId]);

        /* Delete all messages for this pair */
        await db.execute(`DELETE FROM messages WHERE pair_id = ?`, [pairId]);

        /* Delete all pair requests between these users */
        const pair = pairs[0];
        await db.execute(
            `DELETE FROM pair_requests WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)`,
            [pair.user_one, pair.user_two, pair.user_two, pair.user_one]
        );

        /* Delete the pair itself */
        await db.execute(`DELETE FROM pairs WHERE id = ?`, [pairId]);

        res.json({ message: "Disconnected successfully" });

    } catch (err) {
        console.log("DISCONNECT ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
};