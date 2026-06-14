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
import resenasRoutes from "../routes/resenasRoutes.js";
import soporteRoutes from "../routes/soporteRoutes.js";

dotenv.config();

const app = express();

app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:5173",
  "https://dulcehogarweb.vercel.app",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS bloqueado para origen: ${origin}`));
    }
  },
  credentials: true,
}));

app.use(express.json());

app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});

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
app.use("/api/resenas", resenasRoutes);
app.use("/api/soporte", soporteRoutes);

app.use("/api", productosRoutes);
app.use("/api", adminPedidosRoutes);
app.use("/api", router);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

export default app;