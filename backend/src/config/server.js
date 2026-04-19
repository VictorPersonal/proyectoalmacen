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
import carritoRoutes from "../routes/carritoRoutes.js";
import productoAdmin from "../routes/productoAdmin.js";
import estadisticasRoutes from "../routes/estadisticasRoutes.js";
import adminPedidosRoutes from "../routes/adminpedidosRoutes.js";
import productosRoutes from "../routes/productosRoutes.js";
import { supabase } from "./db.js";
import mercadopagoRoutes from "../routes/mercadopagoRoutes.js";
import removeBgRoutes from "../routes/removeBgRoutes.js";
import promocionesRoutes from "../routes/promocionesRoutes.js";

 
dotenv.config();
 
const app = express();
const isProduction = process.env.NODE_ENV === "production";
 
app.use(cookieParser());
 
const FRONTEND_URL = isProduction
  ? process.env.FRONTEND_URL_PROD
  : "http://localhost:5173";
 
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
 
// express.json() global — aplica a todas las rutas
app.use(express.json());
 
// 🔹 Inyectar supabase en cada request
app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});
 
// ✅ Rutas específicas PRIMERO (más largas/concretas antes que las genéricas /api)
app.use("/api/auth", authRoutes);
app.use("/api/auth", passwordRoutes);
app.use("/api/", categoriaRoutes);
app.use("/api/marcas", marcasRoutes);
app.use("/api/productosAdmin", productoAdmin);
app.use("/api/estadisticas", estadisticasRoutes);
app.use("/api/carrito", carritoRoutes);
app.use("/api/", favoritoRoutes);
app.use("/api/pago", mercadopagoRoutes);
app.use("/api/images", removeBgRoutes);
app.use("/api", promocionesRoutes);
 
// ⚠️ Rutas genéricas /api AL FINAL para no interceptar las específicas
app.use("/api", productosRoutes);
app.use("/api", adminPedidosRoutes);
app.use("/api", router);
 
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});