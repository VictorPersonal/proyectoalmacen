import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { supabase } from "../config/db.js";
import { verificarToken } from "../controller/authMiddleware.js";

dotenv.config();

const authRoutes = express.Router();

/* =========================================================
   AUTENTICACIÓN Y USUARIOS
========================================================= */

// Registro de usuario
authRoutes.post("/usuario", async (req, res) => {
  const {
    cedula,
    nombre,
    apellido,
    direccion,
    email,
    ciudad,
    contrasena,
    rol,
  } = req.body;

  if (!cedula || !nombre || !email || !contrasena) {
    return res
      .status(400)
      .json({
        message:
          "Faltan datos obligatorios (cédula, nombre, email, contraseña).",
      });
  }

  try {
    // Validar si la cédula ya existe
    const { data: cedulaExistente, error: errorCedula } = await supabase
      .from("usuario")
      .select("cedula")
      .eq("cedula", cedula);

    if (errorCedula) throw errorCedula;

    if (cedulaExistente.length > 0) {
      return res.status(409).json({ message: "La cédula ya está registrada" });
    }

    // Cifrar contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // Insertar usuario
    const { data, error } = await supabase
      .from("usuario")
      .insert([
        {
          cedula,
          nombre,
          apellido: apellido || "",
          direccion: direccion || "",
          email,
          ciudad: ciudad || "",
          password: hashedPassword,
          rol: rol || "cliente",
        },
      ])
      .select("cedula, nombre, apellido, email, ciudad, rol")
      .single();

    if (error) throw error;

    res.status(201).json({
      message: "Usuario registrado correctamente",
      usuario: data,
    });
  } catch (error) {
    console.error("❌ Error al registrar usuario:", error.message);
    res.status(500).json({ message: "Error al registrar usuario" });
  }
});

// Login
authRoutes.post("/login", async (req, res) => {
  const { email, contrasena } = req.body;

  if (!email || !contrasena) {
    return res
      .status(400)
      .json({ message: "Correo y contraseña son obligatorios" });
  }

  try {
    const { data: usuarios, error } = await supabase
      .from("usuario")
      .select("*")
      .eq("email", email)
      .limit(1);

    if (error) throw error;

    if (!usuarios || usuarios.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const usuario = usuarios[0];

    const validPassword = await bcrypt.compare(contrasena, usuario.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { id: usuario.cedula, rol: usuario.rol },
      process.env.JWT_SECRET || "clave_secreta_segura",
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // true si usas HTTPS
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Inicio de sesión exitoso",
      usuario: {
        nombre: usuario.nombre,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error("❌ Error en el login:", error.message);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// Obtener perfil de usuario autenticado
authRoutes.get("/usuario/perfil", verificarToken, async (req, res) => {
  const cedula = req.usuario.id;

  try {
    const { data, error } = await supabase
      .from("usuario")
      .select("cedula, nombre, apellido, direccion, ciudad, email, rol, telefono")
      .eq("cedula", cedula)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("❌ Error al obtener perfil:", error.message);
    res.status(500).json({ message: "Error al obtener perfil" });
  }
});

// Actualizar perfil
authRoutes.put("/usuario/perfil", verificarToken, async (req, res) => {
  const cedula = req.usuario.id;
  const { nombre, apellido, direccion, ciudad, telefono } = req.body;

  if (!nombre || !apellido) {
    return res
      .status(400)
      .json({ message: "Nombre y apellido son obligatorios" });
  }

  try {
    const { data: usuarioExistente, error: errorSelect } = await supabase
      .from("usuario")
      .select("cedula")
      .eq("cedula", cedula)
      .limit(1);

    if (errorSelect) throw errorSelect;

    if (!usuarioExistente || usuarioExistente.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const { data, error } = await supabase
      .from("usuario")
      .update({
        nombre,
        apellido,
        direccion,
        ciudad,
        telefono,
      })
      .eq("cedula", cedula)
      .select(
        "cedula, nombre, apellido, email, direccion, ciudad, rol, telefono"
      )
      .single();

    if (error) throw error;

    res.status(200).json({
      message: "Perfil actualizado correctamente",
      usuario: data,
    });
  } catch (error) {
    console.error("❌ Error al actualizar perfil:", error.message);
    res.status(500).json({ message: "Error al actualizar el perfil del usuario" });
  }
});

export default authRoutes;