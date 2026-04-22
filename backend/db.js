import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

let db;

const normalizePort = (value) => {
  const port = Number(value);
  return Number.isFinite(port) ? port : undefined;
};

const buildConnectionOptionsFromUrl = (connectionUrl) => {
  if (!connectionUrl) return null;

  try {
    const parsed = new URL(connectionUrl);
    return {
      host: parsed.hostname,
      user: decodeURIComponent(parsed.username || ""),
      password: decodeURIComponent(parsed.password || ""),
      database: parsed.pathname.replace(/^\/+/, "") || undefined,
      port: normalizePort(parsed.port)
    };
  } catch (_err) {
    return null;
  }
};

const buildPrimaryConnectionOptions = () => ({
  host: process.env.MYSQLHOST || process.env.DB_HOST,
  user: process.env.MYSQLUSER || process.env.DB_USER,
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
  database: process.env.MYSQLDATABASE || process.env.DB_NAME,
  port: normalizePort(process.env.MYSQLPORT || process.env.DB_PORT)
});

const connectWithFallback = async () => {
  const primaryOptions = buildPrimaryConnectionOptions();
  const publicUrlOptions = buildConnectionOptionsFromUrl(process.env.MYSQL_PUBLIC_URL);

  try {
    return await mysql.createConnection(primaryOptions);
  } catch (primaryError) {
    const shouldRetryWithPublicUrl =
      publicUrlOptions &&
      primaryOptions.host &&
      publicUrlOptions.host &&
      primaryOptions.host !== publicUrlOptions.host;

    if (!shouldRetryWithPublicUrl) {
      throw primaryError;
    }

    console.warn("Primary DB connection failed, retrying with MYSQL_PUBLIC_URL host:", primaryError.message);
    return mysql.createConnection(publicUrlOptions);
  }
};

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
    db = await connectWithFallback();

    console.log("Railway DB connected");
    await logDBDiagnostics("startup");
  } catch (err) {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  }
};

export const requireDB = () => {
  if (!db) {
    throw new Error("DB connection has not been initialized yet");
  }

  return db;
};

export const liveDB = new Proxy(
  {},
  {
    get(_target, prop) {
      const connection = requireDB();
      const value = connection[prop];
      return typeof value === "function" ? value.bind(connection) : value;
    }
  }
);

export const getDB = () => db;
