import express from "express";
import { pool } from "../config/db.js";

const router = express.Router();

// 📌 Ruta para registrar un nuevo usuario


router.post("/usuario", async (req, res) => {
  const { cedula, nombre, apellido, direccion, email, ciudad, contrasena, rol } = req.body;


  if (!cedula || !nombre || !email || !contrasena) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }

  try {

    // Validar si la cédula ya existe
    const cedulaExistente = await pool.query(
      "SELECT 1 FROM usuario WHERE cedula = $1",
      [cedula]
    );
    if (cedulaExistente.rows.length > 0) {
      return res.status(409).json({ message: "La cédula ya está registrada" });
    }
    
    const result = await pool.query(
      `INSERT INTO usuario (cedula, nombre, apellido, direccion, email, ciudad, password, rol)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [cedula, nombre, apellido || "", direccion || "", email, ciudad || "", contrasena, rol || "cliente"]

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
        apellido: usuario.apellido,
        email: usuario.email,       
        direccion: usuario.direccion,
        ciudad: usuario.ciudad,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error("❌ Error en el login:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});



// 📦 CRUD de productos

// Crear producto
router.post("/producto", async (req, res) => {
  const { nombre, precio, stock, descripcion, idmarca, idcategoria } = req.body;

  if (!nombre || precio == null || stock == null) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO producto (nombre, precio, stock, descripcion, idmarca, idcategoria)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [nombre, precio, stock, descripcion, idmarca || null, idcategoria || null]
    );
    res.status(201).json({ message: "Producto creado", producto: result.rows[0] });
  } catch (error) {
    console.error("❌ Error al crear producto:", error);
    res.status(500).json({ message: "Error al crear producto" });
  }
});

// Obtener todos los productos
router.get("/producto", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM producto");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener productos:", error);
    res.status(500).json({ message: "Error al obtener productos" });
  }
});

// 🔍 Buscar productos por nombre o categoría
router.get("/productos", async (req, res) => {
  const { search } = req.query;

  try {
    // Si no hay término de búsqueda, devolver todos los productos
    if (!search || search.trim() === "") {
      const result = await pool.query("SELECT * FROM producto");
      return res.status(200).json(result.rows);
    }

    // Buscar coincidencias en nombre o descripción (y opcionalmente categoría)
    const result = await pool.query(
      `SELECT * FROM producto
       WHERE LOWER(nombre) LIKE LOWER($1)
       OR LOWER(descripcion) LIKE LOWER($1)`,
      [`%${search}%`]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("❌ Error al buscar productos:", error);
    res.status(500).json({ message: "Error al buscar productos" });
  }
});


// Actualizar producto
router.put("/producto/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, precio, stock, descripcion, idmarca, idcategoria } = req.body;

  try {
    const result = await pool.query(
      `UPDATE producto SET
        nombre = COALESCE($1, nombre),
        precio = COALESCE($2, precio),
        stock = COALESCE($3, stock),
        descripcion = COALESCE($4, descripcion),
        idmarca = COALESCE($5, idmarca),
        idcategoria = COALESCE($6, idcategoria)
       WHERE idproducto = $7
       RETURNING *`,
      [nombre, precio, stock, descripcion, idmarca, idcategoria, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    res.status(200).json({ message: "Producto actualizado", producto: result.rows[0] });
  } catch (error) {
    console.error("❌ Error al actualizar producto:", error);
    res.status(500).json({ message: "Error al actualizar producto" });
  }
});

// Eliminar producto
router.delete("/producto/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM producto WHERE idproducto = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    res.status(200).json({ message: "Producto eliminado", producto: result.rows[0] });
  } catch (error) {
    console.error("❌ Error al eliminar producto:", error);
    res.status(500).json({ message: "Error al eliminar producto" });
  }
});



export default router;


// 📌 ACTUALIZAR PERFIL DEL USUARIO (PUT)
router.put("/usuario/perfil", async (req, res) => {
  const { cedula, nombre, apellido, direccion, ciudad } = req.body;

  // Validar campos obligatorios
  if (!cedula) {
    return res.status(400).json({ message: "Cédula es requerida" });
  }

  if (!nombre || !apellido) {
    return res.status(400).json({ message: "Nombre y apellido son obligatorios" });
  }

  try {
    // Verificar si el usuario existe
    const usuarioExistente = await pool.query(
      "SELECT cedula FROM usuario WHERE cedula = $1",
      [cedula]
    );

    if (usuarioExistente.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Actualizar solo los campos permitidos (sin updated_at)
    const result = await pool.query(
      `UPDATE usuario 
       SET nombre = $1,
           apellido = $2,
           direccion = $3,
           ciudad = $4
       WHERE cedula = $5
       RETURNING cedula, nombre, apellido, email, direccion, ciudad`,
      [nombre, apellido, direccion, ciudad, cedula]
    );

    console.log("✅ Perfil actualizado para cédula:", cedula);
    
    res.status(200).json({ 
      message: "Perfil actualizado correctamente", 
      usuario: result.rows[0] 
    });

  } catch (error) {
    console.error("❌ Error al actualizar perfil:", error);
    res.status(500).json({ message: "Error al actualizar el perfil del usuario" });
  }
});
