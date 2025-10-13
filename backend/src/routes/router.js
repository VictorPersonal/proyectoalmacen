import express from "express";
import { pool } from "../config/db.js";

const router = express.Router();

// 📌 Registrar usuario (siempre como cliente)
router.post("/usuario", async (req, res) => {
  const { cedula, nombre, apellido, direccion, email, ciudad, contrasena } = req.body;

  if (!cedula || !nombre || !email || !contrasena) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO usuario (cedula, nombre, apellido, direccion, email, ciudad, password, rol)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [cedula, nombre, apellido || "", direccion || "", email, ciudad || "", contrasena, "cliente"]
    );

    res.status(201).json({ message: "Usuario registrado correctamente", usuario: result.rows[0] });
  } catch (error) {
    console.error("❌ Error al registrar usuario:", error);
    res.status(500).json({ message: "Error al registrar usuario" });
  }
});


// 📌 Iniciar sesión (válido para cliente y administrador)
router.post("/login", async (req, res) => {
  const { email, contrasena } = req.body;

  if (!email || !contrasena) {
    return res.status(400).json({ message: "Correo y contraseña son obligatorios" });
  }

  try {
    const result = await pool.query("SELECT * FROM usuario WHERE email = $1", [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const usuario = result.rows[0];

    if (usuario.password !== contrasena) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    res.status(200).json({
      message: "Inicio de sesión exitoso",
      usuario: {
        cedula: usuario.cedula,
        nombre: usuario.nombre,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error("❌ Error en el login:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

export default router;
