const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Obtener todos los usuarios
router.get('/', (req, res) => {
  pool.query('SELECT * FROM clienteusuario', (error, result) => {
    if (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).send('Error en el servidor');
    } else {
      res.json(result.rows);
    }
  });
});

//Ruta para iniciar sesión
router.get("/login", async (req, res) => {
  const { email, password } = req.query;

  if (!email || !password) {
    return res.status(400).json({ error: "Faltan campos requeridos" });
  }

  try {
    const query = "SELECT * FROM clienteusuario WHERE email = $1 AND password = $2";
    const result = await pool.query(query, [email, password]);

    if (result.rows.length > 0) {
      res.json({ message: "Inicio de sesión exitoso", redirect: "/home" });
    } else {
      res.status(401).json({ error: "Correo o contraseña incorrectos" });
    }
  } catch (err) {
    console.error("Error al validar usuario:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
});


// Registrar un nuevo usuario (solo con los campos del formulario actual)
router.post('/', (req, res) => {
  const { email, telefono, nombre, contrasena } = req.body;

  if (!email || !telefono || !nombre || !contrasena) {
    return res.status(400).json({ message: 'Faltan datos obligatorios' });
  }

  const query = `
    INSERT INTO clienteusuario (email, telefono, nombre, password)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;

  pool.query(query, [email, telefono, nombre, contrasena], (error, result) => {
    if (error) {
      console.error('Error al registrar usuario:', error);
      res.status(500).json({ message: 'Error al registrar usuario' });
    } else {
      res.status(201).json({ message: 'Usuario registrado con éxito', user: result.rows[0] });
    }
  });
});

module.exports = router;
