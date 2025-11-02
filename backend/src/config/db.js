// db.js
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

// ✅ Verificar conexión a PostgreSQL
pool.connect()
  .then(() => console.log("🟢 Conectado correctamente a PostgreSQL"))
  .catch((err) => console.error("🔴 Error al conectar a PostgreSQL:", err));
