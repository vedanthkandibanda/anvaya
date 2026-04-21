import mysql from "mysql2/promise";

let db;

try {
  db = await mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT
  });

  console.log("✅ Railway DB connected");
} catch (error) {
  console.error("❌ DB connection failed:", error.message);
  process.exit(1);
}

export default db;