import express from "express";
import { enviarCorreoRecuperacion, restablecerContrasena } from "../controller/authController.js";


const router = express.Router();

// Rutas para recuperación de contraseña
router.post("/recuperar", enviarCorreoRecuperacion);
router.post("/reestablecer", restablecerContrasena);

export default router;
