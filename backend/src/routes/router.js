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



// ====================================================================
// 💖 RUTAS DE FAVORITOS DE PRODUCTOS
// ====================================================================

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


// 📌 Obtener todos los favoritos de un usuario
router.get("/favoritos/:cedula", async (req, res) => {
    const { cedula } = req.params;

    try {
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
        console.error("❌ Error al obtener favoritos:", error);
        res.status(500).json({ message: "Error al obtener favoritos" });
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



export default router;