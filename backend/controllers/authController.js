import db from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
    try {
        let { username, email, phone, password, gender } = req.body;

        // 🧼 CLEAN INPUT
        username = username?.trim().toLowerCase();
        email = email?.trim().toLowerCase();
        phone = phone?.trim();

        // ❌ EMPTY CHECK
        if (!username || !email || !phone || !password) {
            return res.status(400).json({
                status: "error",
                message: "All required fields must be filled"
            });
        }

        // ❌ VALIDATION
        if (username.length < 4) {
            return res.status(400).json({ status: "error", message: "Invalid username" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ status: "error", message: "Invalid email" });
        }

        if (!/^\d{10}$/.test(phone)) {
            return res.status(400).json({ status: "error", message: "Invalid phone number" });
        }

        const special = /[!@#$%^&*]/;
        const numbers = (password.match(/\d/g) || []).length >= 2;

        if (password.length < 8 || !special.test(password) || !numbers) {
            return res.status(400).json({ status: "error", message: "Weak password" });
        }

        // 🔍 CHECK DUPLICATES
        const [existingUser] = await db.execute(
            "SELECT * FROM users WHERE username = ? OR email = ? OR phone = ?",
            [username, email, phone]
        );

        if (existingUser.length > 0) {
            const user = existingUser[0];

            if (user.username === username) {
                return res.status(409).json({ status: "error", message: "Username already exists" });
            }

            if (user.email === email) {
                return res.status(409).json({ status: "error", message: "Email already exists" });
            }

            if (user.phone === phone) {
                return res.status(409).json({ status: "error", message: "Phone already exists" });
            }
        }

        // 🔐 HASH PASSWORD
        const hashedPassword = await bcrypt.hash(password, 10);

        // 💾 INSERT USER
        await db.execute(
            "INSERT INTO users (username, email, phone, password, gender) VALUES (?, ?, ?, ?, ?)",
            [username, email, phone, hashedPassword, gender]
        );

        return res.status(201).json({
            status: "success",
            message: "Account created successfully"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "error",
            message: "Server error"
        });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { loginId, password } = req.body;

        /* EMPTY CHECK */
        if (!loginId || !password) {
            return res.status(400).json({
                status: "error",
                message: "All fields are required"
            });
        }

        /* IDENTIFY EMAIL OR PHONE */
        let query = "";
        let value = "";

        if (loginId.includes("@")) {
            query = "SELECT * FROM users WHERE email = ?";
            value = loginId;
        } else {
            query = "SELECT * FROM users WHERE phone = ?";
            value = loginId;
        }

        /* FIND USER */
        const [rows] = await db.execute(query, [value]);

        if (rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "User not registered"
            });
        }

        const user = rows[0];

        /* PASSWORD CHECK */
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                status: "error",
                message: "Incorrect password"
            });
        }

        /* TOKEN */
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.json({
            status: "success",
            message: "Welcome back ❤️",
            token,
            firstLogin: user.first_login === 1,
            user: {
                id: user.id,
                username: user.username
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "error",
            message: "Something went wrong"
        });
    }
};