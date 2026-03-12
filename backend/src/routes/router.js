// backend/src/routes/router.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../config/db.js";           // BD principal (tablas)
import { supabase as supabaseDB } from "../config/supabase.js"; // Storage / imágenes
import { verificarToken } from "../controller/authMiddleware.js";
import busboy from "busboy";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();



/* =========================================================
   TEST ROUTER
========================================================= */

router.get("/ping", (req, res) => {
  res.json({ ok: true, mensaje: "Router principal funcionando" });
});










export default router;