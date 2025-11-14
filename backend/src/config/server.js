// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import router from "../routes/router.js";
import authRoutes from "../routes/authRoutes.js";
import { supabase } from "./db.js"; 
import stripeRoutes from "../routes/stripeRoutes.js";

dotenv.config();

const app = express();

// ✅ Middlewares
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173", // tu frontend
  credentials: true,
}));
app.use(express.json());

// 🔹 Inyectar supabase en cada request (opcional pero útil)
app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});

// ✅ Rutas
app.use("/api/auth", authRoutes);
app.use("/api", router);
app.use("/api/stripe", stripeRoutes);

// ✅ Servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
