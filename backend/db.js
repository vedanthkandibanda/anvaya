import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

let db;

export const connectDB = async () => {
  try {
    db = await mysql.createConnection({
      host: process.env.MYSQLHOST,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE,
      port: process.env.MYSQLPORT
    });

    console.log("✅ Railway DB connected");
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  }
};

export const getDB = () => db;