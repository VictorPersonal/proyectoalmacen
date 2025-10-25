import express from "express";
import cors from "cors";
import router from "../routes/router.js";
import authRoutes from "../routes/authRoutes.js";
import dotenv from "dotenv";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// 👇 Todas las rutas del router estarán bajo /api
app.use("/api", router);
app.use("/api/auth", authRoutes); // 👈 Esto es clave

app.listen(process.env.PORT || 4000, () => {
  console.log(`Servidor corriendo en http://localhost:${process.env.PORT || 4000}`);

});