import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";
import router from "../routes/router.js";
import authRoutes from "../routes/authRoutes.js";
import cookieParser from "cookie-parser";

dotenv.config();
const app = express();
const { Pool } = pkg;

// Conexión a la base de datos (igual que ya lo tienes)
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// ✅ Middlewares en el orden correcto
app.use(cookieParser()); // 🔥 Mueve esto al inicio, antes de cualquier ruta

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());

// Inyectar pool
app.use((req, res, next) => {
  req.pool = pool;
  next();
});

// ✅ Rutas
app.use("/api/auth", authRoutes);
app.use("/api", router);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});