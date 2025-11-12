import express from "express";
import { pool } from "../config/db.js";
import cloudinary from '../config/cloudinary.js';
import upload from '../config/multer.js';
import fs from 'fs';
import productoRoutes from "../routes/productoRoutes.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { verificarToken } from "../controller/authMiddleware.js";



// import bcrypt from "bcrypt"; // No se usa para mantener tu lógica original

const router = express.Router();

// Ruta para subir imagen a Cloudinary
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'productos_tienda'
    });

    fs.unlinkSync(req.file.path); // elimina el archivo temporal

    res.json({ secure_url: result.secure_url });
  } catch (error) {
    res.status(500).json({ message: 'Error al subir imagen', error });
  }
});

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

        // 2. Cifrar la contraseña antes de guardar
        const hashedPassword = await bcrypt.hash(contrasena, 10);

        // 3. Insertar el nuevo usuario con la contraseña cifrada
        const result = await pool.query(
            `INSERT INTO usuario (cedula, nombre, apellido, direccion, email, ciudad, password, rol)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING cedula, nombre, apellido, email, ciudad, rol`,
            [cedula, nombre, apellido || "", direccion || "", email, ciudad || "", hashedPassword, rol || "cliente"]
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

    // ✅ Comparar contraseña cifrada con bcrypt
    const validPassword = await bcrypt.compare(contrasena, usuario.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    // ✅ Crear token JWT
    const token = jwt.sign(
      { id: usuario.cedula, rol: usuario.rol },
      "clave_secreta_segura", // cámbiala por una más fuerte y guarda en variables de entorno (.env)
      { expiresIn: "1h" }
    );

    // ✅ Enviar cookie HTTP-only
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,       // true si usas HTTPS
      //sameSite: "strict",  previene ataques CSRF
      sameSite: "lax",
      maxAge: 60 * 60 * 1000 // 1 hora
    });

    // ✅ Solo enviamos información mínima al frontend
    res.status(200).json({
      message: "Inicio de sesión exitoso",
      usuario: {
        nombre: usuario.nombre,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error("❌ Error en el login:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});


// ACTUALIZAR PERFIL DEL USUARIO (PUT)
router.put("/usuario/perfil", verificarToken, async (req, res) => {
  const cedula = req.usuario.id; // ✅ viene del token
  const { nombre, apellido, direccion, ciudad } = req.body;

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
      usuario: result.rows[0],
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

router.post("/productos", async (req, res) => {
    try {
        const { nombre, precio, stock, categoria } = req.body;

        if (!nombre || !precio || !stock || !categoria) {
            return res.status(400).json({ message: "Faltan campos obligatorios (nombre, precio, stock, categoría)." });
        }

        const result = await pool.query(
            `INSERT INTO public.producto (nombre, precio, stock, idcategoria) 
             VALUES ($1, $2, $3, $4) 
             RETURNING idproducto AS id, nombre, precio, stock, idcategoria AS categoria;`,
            [nombre, precio, stock, categoria]
        );

        res.status(201).json({
            message: "Producto creado exitosamente",
            producto: result.rows[0]
        });

    } catch (error) {
        console.error("❌ Error al crear producto:", error);
        res.status(500).json({ message: "Error al crear producto", error: error.message });
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
router.use("/carrito", verificarToken);

// 🔹 Obtener productos del carrito del usuario autenticado
router.get("/carrito", async (req, res) => {
  const cedula = req.usuario.id;

  try {
    const result = await pool.query(
      `SELECT 
         c.idproducto, 
         p.nombre, 
         p.precio,
         c.cantidad, 
         (p.precio * c.cantidad) AS subtotal
       FROM carrito c
       INNER JOIN producto p ON c.idproducto = p.idproducto
       WHERE c.cedula = $1
       ORDER BY p.nombre ASC;`,
      [cedula]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener carrito:", error);
    res.status(500).json({ message: "Error al obtener el carrito" });
  }
});

// 🔹 Agregar o actualizar producto en el carrito
router.post("/carrito/agregar", async (req, res) => {
  const cedula = req.usuario.id;
  const { idproducto, cantidad } = req.body;

  if (!idproducto || !cantidad) {
    return res.status(400).json({ message: "Faltan datos: idproducto o cantidad" });
  }

  try {
    const existe = await pool.query(
      "SELECT cantidad FROM carrito WHERE cedula = $1 AND idproducto = $2",
      [cedula, idproducto]
    );

    if (existe.rows.length > 0) {
      // ✅ Si ya existe, actualizar cantidad
      await pool.query(
        "UPDATE carrito SET cantidad = cantidad + $1 WHERE cedula = $2 AND idproducto = $3",
        [cantidad, cedula, idproducto]
      );
    } else {
      // ✅ Si no existe, insertar nuevo registro
      await pool.query(
        "INSERT INTO carrito (cedula, idproducto, cantidad) VALUES ($1, $2, $3)",
        [cedula, idproducto, cantidad]
      );
    }

    res.status(200).json({ message: "Producto agregado correctamente al carrito" });
  } catch (error) {
    console.error("❌ Error al agregar producto al carrito:", error);
    res.status(500).json({ message: "Error al agregar producto al carrito" });
  }
});

// 🔹 Eliminar un producto específico del carrito
router.delete("/carrito/eliminar/:idproducto", async (req, res) => {
  const cedula = req.usuario.id;
  const { idproducto } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM carrito WHERE cedula = $1 AND idproducto = $2",
      [cedula, idproducto]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Producto no encontrado en el carrito" });
    }

    res.status(200).json({ message: "Producto eliminado correctamente del carrito" });
  } catch (error) {
    console.error("❌ Error al eliminar producto del carrito:", error);
    res.status(500).json({ message: "Error al eliminar producto del carrito" });
  }
});

// 🔹 Vaciar completamente el carrito del usuario autenticado
router.delete("/carrito/vaciar", async (req, res) => {
  const cedula = req.usuario.id;

  try {
    await pool.query("DELETE FROM carrito WHERE cedula = $1", [cedula]);
    res.status(200).json({ message: "Carrito vaciado exitosamente" });
  } catch (error) {
    console.error("❌ Error al vaciar carrito:", error);
    res.status(500).json({ message: "Error al vaciar carrito" });
  }
});









// ====================================================================
// 💖 RUTAS DE FAVORITOS DE PRODUCTOS
// ====================================================================


// GET: Obtiene los favoritos del usuario autenticado
router.get("/favoritos", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const decoded = jwt.verify(token, "clave_secreta_segura");
    const cedula = decoded.id;

    const result = await pool.query(
      `SELECT 
          f.idfavorito, 
          f.fechaagregado, 
          p.idproducto, 
          p.nombre, 
          p.precio, 
          p.descripcion, 
          p.stock
       FROM favoritoproducto f
       INNER JOIN producto p ON f.idproducto = p.idproducto
       WHERE f.cedula = $1
       ORDER BY f.fechaagregado DESC;`,
      [cedula]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener favoritos del usuario autenticado:", error);
    res.status(500).json({ message: "Error al obtener favoritos" });
  }
});




// 📌 Agregar producto a favoritos
router.post("/favoritos", async (req, res) => {
    const { cedula, idproducto } = req.body;

    if (!cedula || !idproducto) {
        return res.status(400).json({ message: "Faltan datos obligatorios (cedula, idproducto)." });
    }

    try {
        // Validar que la cédula exista en la tabla usuario
        const usuarioExiste = await pool.query(
            "SELECT 1 FROM usuario WHERE cedula = $1", // El 1 en el SELECT es una práctica para optimizar la consulta, pues se necesita saber si el registro existe, NO se NECESITAN obtener todos los datos
            [cedula]
        );
        if (usuarioExiste.rows.length === 0) {
            return res.status(404).json({ message: `No existe un usuario con la cédula ${cedula}.` });
        }

        // Validar que el producto exista en la tabla producto
        const productoExiste = await pool.query(
            "SELECT 1 FROM producto WHERE idproducto = $1",
            [idproducto]
        );
        if (productoExiste.rows.length === 0) {
            return res.status(404).json({ message: `No existe un producto con el ID ${idproducto}.` });
        }

        // Verificar si ya está en favoritos
        const existe = await pool.query(
            "SELECT 1 FROM favoritoproducto WHERE cedula = $1 AND idproducto = $2",
            [cedula, idproducto]
        );

        if (existe.rows.length > 0) {
            return res.status(400).json({ message: "El producto ya está en favoritos." });
        }

        // Insertar nuevo favorito
        const result = await pool.query(
            `INSERT INTO favoritoproducto (fechaagregado, cedula, idproducto)
             VALUES (CURRENT_DATE, $1, $2)
             RETURNING idfavorito, fechaagregado, cedula, idproducto;`,
            [cedula, idproducto]
        );

        res.status(201).json({
            message: "Producto agregado a favoritos correctamente.",
            favorito: result.rows[0]
        });

    } catch (error) {
        console.error("❌ Error al agregar favorito:", error);
        res.status(500).json({ message: "Error interno al agregar favorito." });
    }
});



// 📌 Eliminar un producto de favoritos
router.delete("/favoritos/:cedula/:idproducto", async (req, res) => {
    const { cedula, idproducto } = req.params;

    try {
        const result = await pool.query(
            "DELETE FROM favoritoproducto WHERE cedula = $1 AND idproducto = $2 RETURNING *",
            [cedula, idproducto]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "El producto no estaba en favoritos." });
        }

        res.status(200).json({ message: "Producto eliminado de favoritos correctamente." });

    } catch (error) {
        console.error("❌ Error al eliminar favorito:", error);
        res.status(500).json({ message: "Error al eliminar favorito" });
    }
});




router.get("/usuario/perfil", verificarToken, async (req, res) => {
  const cedula = req.usuario.id; // 👈 viene del token JWT

  try {
    const result = await pool.query(
      "SELECT cedula, nombre, apellido, direccion, ciudad, email, rol FROM usuario WHERE cedula = $1",
      [cedula]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error al obtener perfil:", error);
    res.status(500).json({ message: "Error al obtener perfil" });
  }
});

router.get("/estadisticas/ventas-mensuales",verificarToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        TO_CHAR(p.fechaelaboracionpedido, 'Mon') AS mes,
        SUM(dp.subtotal) AS total
      FROM pedido p
      JOIN detallepedidoMM dp ON p.idpedido = dp.idpedido
      GROUP BY mes
      ORDER BY MIN(p.fechaelaboracionpedido);
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener ventas mensuales:", err);
    res.status(500).json({ error: "Error al obtener ventas mensuales" });
  }
});

// 🍰 Productos más vendidos
router.get("/estadisticas/productos-mas-vendidos",verificarToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        pr.nombre,
        SUM(dp.cantidad) AS ventas
      FROM detallepedidoMM dp
      JOIN producto pr ON dp.idproducto = pr.idproducto
      GROUP BY pr.nombre
      ORDER BY ventas DESC
      LIMIT 5;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener productos más vendidos:", err);
    res.status(500).json({ error: "Error al obtener productos más vendidos" });
  }
});

// 👥 Usuarios por tipo (rol)
router.get("/estadisticas/usuarios", verificarToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COALESCE(rol, 'sin rol') AS tipo,
        COUNT(*)::int AS cantidad
      FROM usuario
      GROUP BY tipo;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener usuarios:", err);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

router.get("/estadisticas/estados-pedidos", verificarToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        e.descripcion AS estado,
        COUNT(p.idpedido)::int AS cantidad
      FROM pedido p
      JOIN estadopedido e ON p.idestadopedido = e.idestadopedido
      GROUP BY e.descripcion
      ORDER BY cantidad DESC;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener estados de pedido:", err);
    res.status(500).json({ error: "Error al obtener estados de pedido" });
  }
});

export default router;
