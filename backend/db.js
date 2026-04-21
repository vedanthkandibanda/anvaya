import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

let db;

const getRuntimeFingerprint = () => ({
  railwayProject: process.env.RAILWAY_PROJECT_NAME || null,
  railwayEnvironment: process.env.RAILWAY_ENVIRONMENT_NAME || null,
  railwayService: process.env.RAILWAY_SERVICE_NAME || null,
  railwayDeployment: process.env.RAILWAY_DEPLOYMENT_ID || null,
  mysqlHost: process.env.MYSQLHOST || null,
  mysqlPort: process.env.MYSQLPORT || null,
  mysqlDatabase: process.env.MYSQLDATABASE || null,
  mysqlUser: process.env.MYSQLUSER || null
});

export const logDBDiagnostics = async (label = "db") => {
  if (!db) {
    console.warn(`[${label}] DB diagnostics skipped: no active connection`);
    return;
  }

  try {
    const [identityRows] = await db.query(`
      SELECT
        DATABASE() AS active_database,
        CONNECTION_ID() AS connection_id,
        @@hostname AS mysql_hostname,
        @@port AS mysql_port,
        USER() AS session_user,
        CURRENT_USER() AS current_user_name
    `);

    const [tableRows] = await db.query(`
      SELECT TABLE_SCHEMA, TABLE_NAME
      FROM information_schema.tables
      WHERE TABLE_NAME = 'messages'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `);

    console.log(`[${label}] Runtime fingerprint:`, getRuntimeFingerprint());
    console.log(`[${label}] Connection identity:`, identityRows[0]);
    console.log(`[${label}] Visible 'messages' tables:`, tableRows);
  } catch (err) {
    console.error(`[${label}] DB diagnostics failed:`, err.message);
  }
};

export const connectDB = async () => {
  try {
    db = await mysql.createConnection({
      host: process.env.MYSQLHOST,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE,
      port: process.env.MYSQLPORT
    });

    console.log("Railway DB connected");
    await logDBDiagnostics("startup");
  } catch (err) {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  }
};

export const getDB = () => db;
