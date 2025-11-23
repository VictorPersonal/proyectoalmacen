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
app.use(express.json());

app.use(cookieParser());
app.use(cors({
  origin: [ 
    "http://localhost:5173"              // desarrollo
  ],
  credentials: true
}));

// 🔹 Inyectar supabase en cada request
app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});

// ✅ Rutas - aplicar express.json() SOLO donde sea necesario
app.use("/api/auth", express.json(), authRoutes);
app.use("/api", router); // Esta ruta usa busboy para FormData
app.use("/api/stripe", express.json(), stripeRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});