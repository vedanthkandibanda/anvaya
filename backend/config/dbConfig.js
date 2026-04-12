import mysql from "mysql2/promise";

let db;

try {
    db = await mysql.createConnection({
        host: process.env.DB_HOST || "127.0.0.1",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "1234",
        database: process.env.DB_NAME || "anvaya",
    });
    console.log("DB connected successfully");
} catch (error) {
    console.error("DB connection failed:", error.message);
    console.error("Please ensure MySQL is running and the database exists.");
    process.exit(1);
}

export default db;