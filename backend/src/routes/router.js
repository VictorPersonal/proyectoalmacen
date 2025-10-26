import express from "express";
import { pool } from "../config/db.js";
// import bcrypt from "bcrypt"; // No se usa para mantener tu lógica original

const router = express.Router();

// ====================================================================
// 📌 RUTAS DE USUARIO Y AUTENTICACIÓN (USANDO LÓGICA DE CONTRASEÑA INSEGURA)
// ====================================================================

// Ruta para registrar un nuevo usuario
router.post("/usuario", async (req, res) => {
    const { cedula, nombre, apellido, direccion, email, ciudad, contrasena, rol } = req.body;

    if (!cedula || !nombre || !email || !contrasena) {
        return res.status(400).json({ message: "Faltan datos obligatorios (cédula, nombre, email, contraseña)." });
    }

    try {
        // 1. Validar si la cédula ya existe
        const cedulaExistente = await pool.query(
            "SELECT 1 FROM usuario WHERE cedula = $1",
            [cedula]
        );
        if (cedulaExistente.rows.length > 0) {
            return res.status(409).json({ message: "La cédula ya está registrada" });
        }

        // 2. Insertar el nuevo usuario con la contraseña en texto plano (⚠️ INSEGURO)
        const result = await pool.query(
            `INSERT INTO usuario (cedula, nombre, apellido, direccion, email, ciudad, password, rol)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING cedula, nombre, apellido, email, ciudad, rol`,
            [cedula, nombre, apellido || "", direccion || "", email, ciudad || "", contrasena, rol || "cliente"] // Usa 'contrasena' directamente
        );

        res.status(201).json({ message: "Usuario registrado correctamente", usuario: result.rows[0] });
    } catch (error) {
        console.error("❌ Error al registrar usuario:", error);
        res.status(500).json({ message: "Error al registrar usuario" });
    }
});


// Iniciar sesión (válido para cliente y administrador)
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

        // ⚠️ Comparación de contraseña en texto plano (INSEGURO)
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


// ACTUALIZAR PERFIL DEL USUARIO (PUT)
router.put("/usuario/perfil", async (req, res) => {
    const { cedula, nombre, apellido, direccion, ciudad } = req.body;

    if (!cedula) {
        return res.status(400).json({ message: "Cédula es requerida" });
    }
    if (!nombre || !apellido) {
        return res.status(400).json({ message: "Nombre y apellido son obligatorios" });
    }

    try {
        const usuarioExistente = await pool.query(
            "SELECT cedula FROM usuario WHERE cedula = $1",
            [cedula]
        );

        if (usuarioExistente.rows.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        const result = await pool.query(
            `UPDATE usuario 
             SET nombre = $1, apellido = $2, direccion = $3, ciudad = $4
             WHERE cedula = $5
             RETURNING cedula, nombre, apellido, email, direccion, ciudad, rol`,
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


// ====================================================================
// 📦 CRUD DE PRODUCTOS (FUNCIONALIDAD CORREGIDA)
// ====================================================================

// RUTA UNIFICADA: Listar todos o buscar por nombre/descripción (GET /productos)
// ✅ Corrige el error de sintaxis SQL al unificar la lógica
router.get("/productos", async (req, res) => {
    const { search } = req.query; // Captura el parámetro ?search=...

    try {
        let sqlQuery;
        let values = [];

        // 1. Caso de LISTADO SIMPLE (GET /productos)
        if (!search || search.trim() === "") {
            sqlQuery = `SELECT 
                           idproducto AS id, 
                           nombre, 
                           precio, 
                           stock, 
                           idcategoria AS categoria
                        FROM public.producto 
                        ORDER BY idproducto DESC;`;
        } 
        // 2. Caso de BÚSQUEDA (GET /productos?search=...)
        else {
            // ✅ CORRECCIÓN: Se agrega la cláusula WHERE y se usa $1
            sqlQuery = `SELECT 
                           idproducto AS id, 
                           nombre, 
                           precio, 
                           stock, 
                           idcategoria AS categoria
                        FROM public.producto
                        WHERE LOWER(nombre) LIKE $1 
                        OR LOWER(descripcion) LIKE $1 
                        ORDER BY idproducto DESC;`; 
            values = [`%${search}%`]; 
        }

        const result = await pool.query(sqlQuery, values);
        res.status(200).json(result.rows);

    } catch (error) {
        console.error("❌ Error al obtener/buscar productos:", error);
        res.status(500).json({ message: "Error al obtener o buscar productos" });
    }
});


// ---------------------------------------------
// RUTA 1.1: GET /productos/:id (OBTENER UNO)
// ---------------------------------------------
// ✅ RUTA AÑADIDA
router.get("/productos/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT 
                idproducto AS id, 
                nombre, 
                precio, 
                stock, 
                idcategoria AS categoria
            FROM public.producto 
            WHERE idproducto = $1;`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Producto no encontrado." });
        }

        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error("❌ Error al obtener un producto:", error);
        res.status(500).json({ message: "Error al obtener producto por ID" });
    }
});


// RUTA 2: POST /productos (CREAR)
router.post("/api/carrito/agregar", async (req, res) => {
  try {
    const { cedula, idproducto, cantidad, subtotal } = req.body;

    if (!cedula || !idproducto) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const result = await pool.query(
      "INSERT INTO carrito (cedula, idproducto, cantidad, subtotal) VALUES ($1, $2, $3, $4) RETURNING *",
      [cedula, idproducto, cantidad, subtotal]
    );

    res.json({ success: true, carrito: result.rows[0] });
  } catch (err) {
    console.error("❌ Error al agregar producto al carrito:", err);
    res.status(500).json({ error: err.message });
  }
});


// RUTA 3: PUT /productos/:id (ACTUALIZAR)
router.put("/productos/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, precio, stock, categoria } = req.body;

        if (!nombre || !precio || !stock || !categoria) {
            return res.status(400).json({ message: "Faltan campos obligatorios (nombre, precio, stock, categoría)." });
        }

        const result = await pool.query(
            `UPDATE public.producto 
             SET nombre = $1, precio = $2, stock = $3, idcategoria = $4
             WHERE idproducto = $5`,
            [nombre, precio, stock, categoria, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Producto no encontrado." });
        }

        res.status(200).json({ message: `Producto con ID ${id} actualizado correctamente.` });

    } catch (error) {
        console.error("❌ Error al actualizar producto:", error);
        res.status(500).json({ message: "Error al actualizar producto", error: error.message });
    }
});


// RUTA 4: DELETE /productos/:id (ELIMINAR)
router.delete("/productos/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "DELETE FROM public.producto WHERE idproducto = $1",
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Producto no encontrado." });
        }

        res.status(200).json({ message: `Producto con ID ${id} eliminado correctamente.` });

    } catch (error) {
        console.error("❌ Error al eliminar producto:", error);
        res.status(500).json({ message: "Error al eliminar producto", error: error.message });
    }
});

// Obtener productos del carrito de un usuario
router.get("/carrito/:cedula", async (req, res) => {
  const { cedula } = req.params;
  try {
    const result = await pool.query(
      `SELECT 
         c.idproducto, 
         p.nombre, 
         c.cantidad, 
         (p.precio * c.cantidad) AS subtotal
       FROM public.carrito c
       JOIN public.producto p ON c.idproducto = p.idproducto
       WHERE c.cedula = $1`,
      [cedula]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener carrito:", error);
    res.status(500).json({ error: "Error al obtener el carrito" });
  }
});

// Agregar al carrito
router.post("/carrito/agregar", async (req, res) => {
  const { cedula, idproducto, cantidad } = req.body;
  try {
    // Verificar si ya existe
    const existe = await pool.query(
      "SELECT * FROM public.carrito WHERE cedula = $1 AND idproducto = $2",
      [cedula, idproducto]
    );

    if (existe.rows.length > 0) {
      await pool.query(
        "UPDATE public.carrito SET cantidad = cantidad + $1 WHERE cedula = $2 AND idproducto = $3",
        [cantidad, cedula, idproducto]
      );
    } else {
      await pool.query(
        "INSERT INTO public.carrito (cedula, idproducto, cantidad) VALUES ($1, $2, $3)",
        [cedula, idproducto, cantidad]
      );
    }

    res.json({ message: "Producto agregado correctamente al carrito" });
  } catch (error) {
    console.error("❌ Error al agregar al carrito:", error);
    res.status(500).json({ error: "Error al agregar producto al carrito" });
  }
});

// 🗑️ Eliminar un solo producto del carrito
router.delete("/carrito/eliminar/:cedula/:idproducto", async (req, res) => {
  const { cedula, idproducto } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM public.carrito WHERE cedula = $1 AND idproducto = $2",
      [cedula, idproducto]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Producto no encontrado en el carrito" });
    }

    res.json({ message: "Producto eliminado del carrito correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar producto del carrito:", error);
    res.status(500).json({ error: "Error al eliminar producto del carrito" });
  }
});


// 🧹 Vaciar todo el carrito de un usuario
router.delete("/carrito/vaciar/:cedula", async (req, res) => {
  const { cedula } = req.params;
  try {
    await pool.query("DELETE FROM public.carrito WHERE cedula = $1", [cedula]);
    res.json({ message: "Carrito vaciado con éxito" });
  } catch (error) {
    console.error("❌ Error al vaciar carrito:", error);
    res.status(500).json({ error: "Error al vaciar carrito" });
  }
});


export default router;



