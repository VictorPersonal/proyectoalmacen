import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "../routes/authRoutes.js";


dotenv.config();
const app = express();

// Middleware para leer JSON
app.use(express.json());
app.use(cors());

// Montar las rutas
app.use("/api/auth", authRoutes); // 👈 Esto es clave

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
