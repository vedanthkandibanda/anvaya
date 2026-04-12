import db from "../db.js";

function toPublicUploadUrl(value) {
    if (!value) return null;
    if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:")) {
        return value;
    }
    return `http://localhost:5000/uploads/${value}`;
}

export const profileSetup = async (req, res) => {
    try {
        const {
            userId,
            bio,
            age,
            interests,
            love_language,
            mood_type
        } = req.body;
        const profilePic = req.file ? req.file.filename : null;

        if (!userId) {
            return res.status(400).json({
                status: "error",
                message: "User ID missing"
            });
        }

        const updateSql = profilePic
            ? `UPDATE users
               SET bio=?, age=?, interests=?, love_language=?, mood_type=?, profile_pic=?, first_login=0
               WHERE id=?`
            : `UPDATE users
               SET bio=?, age=?, interests=?, love_language=?, mood_type=?, first_login=0
               WHERE id=?`;

        const updateParams = profilePic
            ? [bio, age, interests, love_language, mood_type, profilePic, userId]
            : [bio, age, interests, love_language, mood_type, userId];

        await db.execute(updateSql, updateParams);

        res.json({
            status: "success",
            message: "Profile completed ❤️"
        });

    } catch (err) {
        console.log("PROFILE SETUP ERROR:", err);
        res.status(500).json({
            status: "error",
            message: err.message
        });
    }
};

export const updateUserProfile = async (req, res) => {
    try {
        const { userId, bio, interests } = req.body;
        if (!userId) {
            return res.status(400).json({
                status: "error",
                message: "User ID missing"
            });
        }

        let profilePicFile = null;
        if (req.file) {
            profilePicFile = req.file.filename;
        }

        const [current] = await db.execute(
            `SELECT profile_pic FROM users WHERE id = ?`,
            [userId]
        );

        const existingPic = current[0]?.profile_pic || null;
        const newPic = profilePicFile || existingPic;

        await db.execute(
            `UPDATE users SET bio = ?, interests = ?, profile_pic = ? WHERE id = ?`,
            [bio || null, interests || null, newPic, userId]
        );

        res.json({
            status: "success",
            message: "Profile updated",
            user: {
                id: userId,
                bio,
                interests,
                profile_pic: toPublicUploadUrl(newPic)
            }
        });
    } catch (err) {
        console.log("PROFILE UPDATE ERROR:", err);
        res.status(500).json({
            status: "error",
            message: "Server error"
        });
    }
};

export const getUserProfile = async (req, res) => {
    try {
        const userId = req.params.userId;

        const [users] = await db.execute(
            `SELECT id, username AS name, bio, interests, profile_pic
             FROM users
             WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "User not found"
            });
        }

        const user = users[0];
        user.profile_pic = toPublicUploadUrl(user.profile_pic);

        const [pairs] = await db.execute(
            `SELECT * FROM pairs
             WHERE user_one = ? OR user_two = ?`,
            [userId, userId]
        );

        if (pairs.length === 0) {
            return res.json({
                user,
                partner: null,
                pairId: null,
                isConnected: false
            });
        }

        const pair = pairs[0];
        const partnerId = pair.user_one == userId ? pair.user_two : pair.user_one;

        const [partners] = await db.execute(
            `SELECT id, username AS name, bio, interests, profile_pic
             FROM users
             WHERE id = ?`,
            [partnerId]
        );

        const partner = partners[0] || null;
        if (partner) {
            partner.profile_pic = toPublicUploadUrl(partner.profile_pic);
        }

        res.json({
            user,
            partner,
            pairId: pair.id,
            isConnected: !!partner
        });
    } catch (err) {
        console.error("GET USER PROFILE ERROR:", err);
        res.status(500).json({
            status: "error",
            message: "Server error"
        });
    }
};