import db from "../db.js";

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

        if (!userId) { 
            return res.status(400).json({
                status: "error",
                message: "User ID missing"
            });
        }

        await db.execute(
    `UPDATE users 
     SET bio=?, age=?, interests=?, love_language=?, mood_type=?, first_login=0
     WHERE id=?`,
    [bio, age, interests, love_language, mood_type, userId]
);

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