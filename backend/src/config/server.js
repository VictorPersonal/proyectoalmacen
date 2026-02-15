// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import router from "../routes/router.js";
import authRoutes from "../routes/auth-routes.js";
import categoriaRoutes from "../routes/categoriaRoutes.js";
import passwordRoutes from "../routes/passwordroutes.js";
import marcasRoutes from "../routes/marcasRoutes.js";
import favoritoRoutes from "../routes/favoritoRoutes.js";
import productoAdmin from "../routes/productoAdmin.js";
import { supabase } from "./db.js"; 
import stripeRoutes from "../routes/stripeRoutes.js";

dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === "production";
app.use(express.json());

app.use(cookieParser());
const FRONTEND_URL = isProduction
  ? process.env.FRONTEND_URL_PROD        // ejemplo: https://dulcehogar.netlify.app
  : "http://localhost:5173";

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

// 🔹 Inyectar supabase en cada request
app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});

// ✅ Rutas - aplicar express.json() SOLO donde sea necesario
app.use("/api/auth", express.json(), authRoutes);
app.use("/api/password", express.json(), passwordRoutes);
app.use("/api", router); // Esta ruta usa busboy para FormData
app.use("/api/categorias", express.json(), categoriaRoutes);
app.use("/api/marcas", express.json(), marcasRoutes);
app.use("/api/productosAdmin", express.json(), productoAdmin);
app.use("/api/favoritos", express.json(), favoritoRoutes); // Ruta para favoritos
app.use("/api/stripe", express.json(), stripeRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});