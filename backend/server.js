import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import multer from "multer";

import { connectDB } from "./db.js";

await connectDB();


import db from "./config/dbConfig.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import pairRoutes from "./routes/pairRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import vaultRoutes from "./routes/vaultRoutes.js";
import musicRoutes from "./routes/musicRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/pair", pairRoutes);
app.use("/api/messages", messageRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/uploads", express.static("backend/uploads"));
app.use("/api/profile", profileRoutes);
app.use("/api/vault", vaultRoutes);
app.use("/api/music", musicRoutes);


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

export const upload = multer({ storage });

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

export { io };

let onlineUsers = {};

io.on("connection", (socket) => {

    socket.on("joinRoom", ({ pairId, userId }) => {
        socket.join(pairId);

        // store user online
        onlineUsers[userId] = socket.id;

        io.to(pairId).emit("userOnline", userId);
    });

    // 🔥 TYPING
    socket.on("typing", ({ pairId, userId }) => {
        socket.to(pairId).emit("showTyping", userId);
    });

    socket.on("stopTyping", ({ pairId, userId }) => {
        socket.to(pairId).emit("hideTyping");
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });

    socket.on("messageDelivered", (pairId) => {
    socket.to(pairId).emit("updateDelivered");
    });

    socket.on("messageSeen", (pairId) => {
    socket.to(pairId).emit("updateSeen");
    });

    socket.on("sendMoment", (data) => {
    socket.to(data.pairId).emit("receiveMoment", data);
    });

    /* INVITE */
    socket.on("musicInvite", (data) => {
        socket.to(data.pairId).emit("musicInvite", data);
    });

    /* JOIN */
    socket.on("musicJoin", (data) => {
        socket.to(data.pairId).emit("musicJoined");
    });

    /* SYNC */
    socket.on("musicSync", (data) => {
        socket.to(data.pairId).emit("musicSync", data);
    });
});

setInterval(async () => {
    try {
        const [messages] = await db.query(
            "SELECT * FROM messages WHERE is_delayed=1 AND deliver_at <= UTC_TIMESTAMP()"
        );

        for (let msg of messages) {
            console.log(`Delivering scheduled message id=${msg.id} pair=${msg.pair_id} sender=${msg.sender_id} deliver_at=${msg.deliver_at}`);

            // mark as normal before notifying clients so the message is visible when clients reload
            await db.query(
                "UPDATE messages SET is_delayed=0 WHERE id=?",
                [msg.id]
            );

            // send via socket
            io.to(msg.pair_id).emit("receiveMessage", {
                senderId: msg.sender_id,
                message: msg.message
            });

            // notify sender that the scheduled message was sent
            io.to(msg.pair_id).emit("scheduledMessageSent", {
                senderId: msg.sender_id,
                messageId: msg.id
            });
        }
    } catch (err) {
        console.error("Scheduled message delivery failed:", err);
    }
}, 5000); // check every 5 sec

setInterval(async () => {

    const [messages] = await db.query(`
        SELECT * FROM messages 
        WHERE deliver_at IS NOT NULL 
        AND deliver_at <= NOW()
        AND status = 'sent'
    `);

    for (let msg of messages) {

        // update status → delivered
        await db.query(
            "UPDATE messages SET status='delivered' WHERE id=?",
            [msg.id]
        );

        // send to chat (real-time) with a normalized payload
        io.to(msg.pair_id).emit("receiveMessage", {
            ...msg,
            senderId: msg.sender_id,
            sender_id: msg.sender_id
        });
    }

}, 5000); // every 5 seconds

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});