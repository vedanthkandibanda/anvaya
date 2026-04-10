import mysql from "mysql2/promise";

const db = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "1234",
    database: process.env.DB_NAME || "anvaya",
});
console.log("DB connected successfully");
export default db;