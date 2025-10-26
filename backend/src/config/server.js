import express from "express";
import cors from "cors";
import router from "../routes/router.js";
import authRoutes from "../routes/authRoutes.js";
import dotenv from "dotenv";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// ✅ Rutas principales
app.use("/api", router);            // Rutas generales (productos, etc.)
app.use("/api/auth", authRoutes);   // Rutas de autenticación

// ✅ Rutas de favoritos
// En lugar de volver a usar el mismo router completo, definimos el prefijo correcto:
app.use("/api", router); // De esta forma /favoritos funcionará como /api/favoritos

// Servidor activo
app.listen(process.env.PORT || 4000, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${process.env.PORT || 4000}`);
});
