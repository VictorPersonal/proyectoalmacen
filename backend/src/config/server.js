// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";
import router from "../routes/router.js";
import authRoutes from "../routes/authRoutes.js";

dotenv.config();
const app = express();
const { Pool } = pkg;

// ✅ Conexión a PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,        // ej: "postgres"
  host: process.env.DB_HOST,        // ej: "localhost"
  database: process.env.DB_NAME,    // ej: "dulcehogar"
  password: process.env.DB_PASSWORD,// tu contraseña
  port: process.env.DB_PORT,        // ej: 5432
});

// Verificar conexión
pool.connect()
  .then(() => console.log("🟢 Conectado a PostgreSQL correctamente"))
  .catch((err) => console.error("🔴 Error al conectar a PostgreSQL:", err));

// Middleware
app.use(cors());
app.use(express.json());

// Middleware para agregar `pool` a todas las rutas
app.use((req, res, next) => {
  req.pool = pool;
  next();
});

// ✅ Rutas
app.use("/api", router);           // Rutas generales (productos, favoritos, etc.)
app.use("/api/auth", authRoutes);  // Rutas de autenticación

// Servidor activo
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
