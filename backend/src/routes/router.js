import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import cloudinary from "cloudinary";
import { supabase } from "../config/db.js";
import { verificarToken } from "../controller/authMiddleware.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();


/*router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No se subió ninguna imagen" });
    }

    // 🔹 Subir imagen al folder de productos
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "productos_tienda",
    });

    // 🔹 Eliminar el archivo temporal local
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      message: "Imagen subida correctamente",
      secure_url: result.secure_url,
    });
  } catch (error) {
    console.error("❌ Error al subir imagen:", error);
    res.status(500).json({
      message: "Error al subir imagen",
      error: error.message || error,
    });
  }
});*/


// ====================================================================
// 🧾 REGISTRO DE USUARIO
// ====================================================================
router.post("/usuario", async (req, res) => {
  const { cedula, nombre, apellido, direccion, email, ciudad, contrasena, rol } = req.body;

  if (!cedula || !nombre || !email || !contrasena) {
    return res
      .status(400)
      .json({ message: "Faltan datos obligatorios (cédula, nombre, email, contraseña)." });
  }

  try {
    // 1️⃣ Validar si la cédula ya existe
    const { data: cedulaExistente, error: errorCedula } = await supabase
      .from("usuario")
      .select("cedula")
      .eq("cedula", cedula);

    if (errorCedula) throw errorCedula;
    if (cedulaExistente.length > 0) {
      return res.status(409).json({ message: "La cédula ya está registrada" });
    }

    // 2️⃣ Cifrar la contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // 3️⃣ Insertar usuario nuevo
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

// ====================================================================
// 🔑 INICIAR SESIÓN
// ====================================================================
router.post("/login", async (req, res) => {
  const { email, contrasena } = req.body;

  if (!email || !contrasena) {
    return res.status(400).json({ message: "Correo y contraseña son obligatorios" });
  }

  try {
    const { data: usuarios, error } = await supabase
      .from("usuario")
      .select("*")
      .eq("email", email)
      .limit(1);

    if (error) throw error;
    if (usuarios.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const usuario = usuarios[0];

    // ✅ Comparar contraseña cifrada
    const validPassword = await bcrypt.compare(contrasena, usuario.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    // ✅ Crear token JWT
    const token = jwt.sign(
      { id: usuario.cedula, rol: usuario.rol },
      process.env.JWT_SECRET || "clave_secreta_segura",
      { expiresIn: "1h" }
    );

    // ✅ Enviar cookie HTTP-only
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // Cambia a true si usas HTTPS
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

// ====================================================================
// ✏️ ACTUALIZAR PERFIL DEL USUARIO
// ====================================================================
router.get("/usuario/perfil", verificarToken, async (req, res) => {
  const cedula = req.usuario.id; // viene del token

  try {
    const { data, error } = await supabase
      .from("usuario")
      .select("cedula, nombre, apellido, email, direccion, ciudad, rol")
      .eq("cedula", cedula)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    console.log("✅ Perfil obtenido para cédula:", cedula);
    res.status(200).json(data);
  } catch (error) {
    console.error("❌ Error al obtener perfil:", error.message);
    res.status(500).json({ message: "Error al obtener el perfil del usuario" });
  }
});

// ✅ ENDPOINT PUT - ACTUALIZA DATOS
router.put("/usuario/perfil", verificarToken, async (req, res) => {
  const cedula = req.usuario.id; // viene del token
  const { nombre, apellido, direccion, ciudad } = req.body;

  if (!nombre || !apellido) {
    return res.status(400).json({ message: "Nombre y apellido son obligatorios" });
  }

  try {
    // Verificar que el usuario exista
    const { data: usuarioExistente, error: errorSelect } = await supabase
      .from("usuario")
      .select("cedula")
      .eq("cedula", cedula)
      .limit(1);

    if (errorSelect) throw errorSelect;
    if (usuarioExistente.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Actualizar perfil
    const { data, error } = await supabase
      .from("usuario")
      .update({ nombre, apellido, direccion, ciudad })
      .eq("cedula", cedula)
      .select("cedula, nombre, apellido, email, direccion, ciudad, rol")
      .single();

    if (error) throw error;

    console.log("✅ Perfil actualizado para cédula:", cedula);
    res.status(200).json({
      message: "Perfil actualizado correctamente",
      usuario: data,
    });
  } catch (error) {
    console.error("❌ Error al actualizar perfil:", error.message);
    res.status(500).json({ message: "Error al actualizar el perfil del usuario" });
  }
});

// ====================================================================
// 🔍 LISTAR TODOS O BUSCAR POR NOMBRE/DESCRIPCIÓN
// ====================================================================
// ✅ Endpoint para obtener TODOS los productos
router.get("/productos", async (req, res) => {
  const { search } = req.query;
  
  try {
    let query = supabase
      .from("producto")
      .select("idproducto, nombre, precio, stock, idcategoria");

    // Si hay búsqueda, filtrar por nombre
    if (search) {
      query = query.ilike("nombre", `%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Formatear los datos para el frontend
    const productosFormateados = data.map(producto => ({
      id: producto.idproducto,
      nombre: producto.nombre,
      precio: producto.precio,
      stock: producto.stock,
      categoria: producto.idcategoria,
      imagen_url: producto.imagen_url || null,
    }));

    res.status(200).json(productosFormateados);
  } catch (error) {
    console.error("❌ Error al obtener productos:", error.message);
    res.status(500).json({ message: "Error al obtener productos" });
  }
});
// ====================================================================
// 🧾 OBTENER UN PRODUCTO POR ID
// ====================================================================
router.get("/productos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("producto")
      .select("idproducto, nombre, precio, stock, idcategoria")
      .eq("idproducto", id)
      .single();

    if (error && error.code === "PGRST116") {
      return res.status(404).json({ message: "Producto no encontrado." });
    }

    if (error) throw error;

    // Mapear columnas a la estructura que espera el frontend
    const productoFormateado = {
      id: data.idproducto,
      nombre: data.nombre,
      precio: data.precio,
      stock: data.stock,
      categoria: data.idcategoria, // Aquí podrías reemplazar por el nombre real de la categoría si tienes otra tabla
      imagen_url: data.imagen_url || null,
    };

    res.status(200).json(productoFormateado);
  } catch (error) {
    console.error("❌ Error al obtener producto:", error.message);
    res.status(500).json({ message: "Error al obtener producto por ID" });
  }
});


// ====================================================================
// 🛒 AGREGAR PRODUCTO AL CARRITO
// ====================================================================
router.post("/api/carrito/agregar", async (req, res) => {
  try {
    const { cedula, idproducto, cantidad, subtotal } = req.body;

    if (!cedula || !idproducto) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const { data, error } = await supabase
      .from("carrito")
      .insert([{ cedula, idproducto, cantidad, subtotal }])
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, carrito: data });
  } catch (err) {
    console.error("❌ Error al agregar producto al carrito:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ====================================================================
// ➕ CREAR PRODUCTO
// ====================================================================
router.post("/productos", async (req, res) => {
  try {
    const { nombre, precio, stock, categoria } = req.body;

    if (!nombre || !precio || !stock || !categoria) {
      return res
        .status(400)
        .json({ message: "Faltan campos obligatorios (nombre, precio, stock, categoría)." });
    }

    const { data, error } = await supabase
      .from("producto")
      .insert([{ nombre, precio, stock, idcategoria: categoria }])
      .select("idproducto, nombre, precio, stock, idcategoria")
      .single();

    if (error) throw error;

    res.status(201).json({
      message: "Producto creado exitosamente",
      producto: data,
    });
  } catch (error) {
    console.error("❌ Error al crear producto:", error.message);
    res.status(500).json({ message: "Error al crear producto", error: error.message });
  }
});

// ====================================================================
// ✏️ ACTUALIZAR PRODUCTO
// ====================================================================
router.put("/productos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, precio, stock, categoria } = req.body;

    if (!nombre || !precio || !stock || !categoria) {
      return res
        .status(400)
        .json({ message: "Faltan campos obligatorios (nombre, precio, stock, categoría)." });
    }

    const { data, error } = await supabase
      .from("producto")
      .update({ nombre, precio, stock, idcategoria: categoria })
      .eq("idproducto", id)
      .select();

    if (error) throw error;

    if (data.length === 0) {
      return res.status(404).json({ message: "Producto no encontrado." });
    }

    res.status(200).json({ message: `Producto con ID ${id} actualizado correctamente.` });
  } catch (error) {
    console.error("❌ Error al actualizar producto:", error.message);
    res.status(500).json({ message: "Error al actualizar producto", error: error.message });
  }
});

// ====================================================================
// ❌ ELIMINAR PRODUCTO
// ====================================================================
router.delete("/productos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { error, count } = await supabase
      .from("producto")
      .delete()
      .eq("idproducto", id)
      .select("idproducto", { count: "exact" });

    if (error) throw error;
    if (count === 0) {
      return res.status(404).json({ message: "Producto no encontrado." });
    }

    res.status(200).json({ message: `Producto con ID ${id} eliminado correctamente.` });
  } catch (error) {
    console.error("❌ Error al eliminar producto:", error.message);
    res.status(500).json({ message: "Error al eliminar producto", error: error.message });
  }
});

// 🔐 Aplicar middleware de autenticación para todas las rutas del carrito
router.use("/carrito", verificarToken);

// ====================================================================
// 📦 Obtener productos del carrito del usuario autenticado
// ====================================================================
router.get("/carrito", async (req, res) => {
  const cedula = req.usuario.id;

  try {
    const { data, error } = await supabase
      .from("carrito")
      .select(
        `
        idproducto,
        cantidad,
        producto:producto (
          nombre,
          precio
        )
        `
      )
      .eq("cedula", cedula)
      .order("idproducto", { ascending: true });

    if (error) throw error;

    // Transformamos la respuesta para mantener tu formato original
    const carritoFormateado = data.map((item) => ({
      idproducto: item.idproducto,
      nombre: item.producto?.nombre,
      precio: item.producto?.precio,
      cantidad: item.cantidad,
      subtotal: (item.producto?.precio || 0) * item.cantidad,
    }));

    res.status(200).json(carritoFormateado);
  } catch (error) {
    console.error("❌ Error al obtener carrito:", error.message);
    res.status(500).json({ message: "Error al obtener el carrito" });
  }
});

// ====================================================================
// ➕ Agregar o actualizar producto en el carrito
// ====================================================================
router.post("/carrito/agregar", async (req, res) => {
  const cedula = req.usuario.id;
  const { idproducto, cantidad } = req.body;

  if (!idproducto || !cantidad) {
    return res.status(400).json({ message: "Faltan datos: idproducto o cantidad" });
  }

  try {
    // Verificar si ya existe el producto en el carrito
    const { data: existe, error: existeError } = await supabase
      .from("carrito")
      .select("cantidad")
      .eq("cedula", cedula)
      .eq("idproducto", idproducto)
      .maybeSingle();

    if (existeError) throw existeError;

    if (existe) {
      // ✅ Si ya existe, actualizamos la cantidad
      const nuevaCantidad = existe.cantidad + cantidad;
      const { error: updateError } = await supabase
        .from("carrito")
        .update({ cantidad: nuevaCantidad })
        .eq("cedula", cedula)
        .eq("idproducto", idproducto);

      if (updateError) throw updateError;
    } else {
      // ✅ Si no existe, insertamos nuevo registro
      const { error: insertError } = await supabase
        .from("carrito")
        .insert([{ cedula, idproducto, cantidad }]);

      if (insertError) throw insertError;
    }

    res.status(200).json({ message: "Producto agregado correctamente al carrito" });
  } catch (error) {
    console.error("❌ Error al agregar producto al carrito:", error.message);
    res.status(500).json({ message: "Error al agregar producto al carrito" });
  }
});

// ====================================================================
// ❌ Eliminar un producto específico del carrito
// ====================================================================
router.delete("/carrito/eliminar/:idproducto", async (req, res) => {
  const cedula = req.usuario.id;
  const { idproducto } = req.params;

  try {
    const { error, count } = await supabase
      .from("carrito")
      .delete()
      .eq("cedula", cedula)
      .eq("idproducto", idproducto)
      .select("*", { count: "exact" });

    if (error) throw error;
    if (count === 0) {
      return res.status(404).json({ message: "Producto no encontrado en el carrito" });
    }

    res.status(200).json({ message: "Producto eliminado correctamente del carrito" });
  } catch (error) {
    console.error("❌ Error al eliminar producto del carrito:", error.message);
    res.status(500).json({ message: "Error al eliminar producto del carrito" });
  }
});

// ====================================================================
// 🧹 Vaciar completamente el carrito del usuario autenticado
// ====================================================================
router.delete("/carrito/vaciar", async (req, res) => {
  const cedula = req.usuario.id;

  try {
    const { error } = await supabase.from("carrito").delete().eq("cedula", cedula);

    if (error) throw error;

    res.status(200).json({ message: "Carrito vaciado exitosamente" });
  } catch (error) {
    console.error("❌ Error al vaciar carrito:", error.message);
    res.status(500).json({ message: "Error al vaciar carrito" });
  }
});


// ====================================================================
// 📦 Obtener favoritos del usuario autenticado
// ====================================================================
router.get("/favoritos", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const decoded = jwt.verify(token, "clave_secreta_segura");
    const cedula = decoded.id;

    const { data, error } = await supabase
      .from("favoritoproducto")
      .select(`
        idfavorito,
        fechaagregado,
        producto:producto (
          idproducto,
          nombre,
          precio,
          descripcion,
          stock
        )
      `)
      .eq("cedula", cedula)
      .order("fechaagregado", { ascending: false });

    if (error) throw error;

    // Igualamos el formato que devolvía tu PostgreSQL
    const favoritos = data.map((f) => ({
      idfavorito: f.idfavorito,
      fechaagregado: f.fechaagregado,
      idproducto: f.producto?.idproducto,
      nombre: f.producto?.nombre,
      precio: f.producto?.precio,
      descripcion: f.producto?.descripcion,
      stock: f.producto?.stock,
    }));

    res.status(200).json(favoritos);
  } catch (error) {
    console.error("❌ Error al obtener favoritos del usuario autenticado:", error.message);
    res.status(500).json({ message: "Error al obtener favoritos" });
  }
});

// ====================================================================
// ➕ Agregar producto a favoritos
// ====================================================================
router.post("/favoritos", async (req, res) => {
  const { cedula, idproducto } = req.body;

  if (!cedula || !idproducto) {
    return res.status(400).json({ message: "Faltan datos obligatorios (cedula, idproducto)." });
  }

  try {
    // Validar que el usuario exista
    const { data: usuarioExiste, error: errorUsuario } = await supabase
      .from("usuario")
      .select("cedula")
      .eq("cedula", cedula)
      .maybeSingle();

    if (errorUsuario) throw errorUsuario;
    if (!usuarioExiste) {
      return res.status(404).json({ message: `No existe un usuario con la cédula ${cedula}.` });
    }

    // Validar que el producto exista
    const { data: productoExiste, error: errorProducto } = await supabase
      .from("producto")
      .select("idproducto")
      .eq("idproducto", idproducto)
      .maybeSingle();

    if (errorProducto) throw errorProducto;
    if (!productoExiste) {
      return res.status(404).json({ message: `No existe un producto con el ID ${idproducto}.` });
    }

    // Verificar si ya está en favoritos
    const { data: existe, error: errorExiste } = await supabase
      .from("favoritoproducto")
      .select("idfavorito")
      .eq("cedula", cedula)
      .eq("idproducto", idproducto)
      .maybeSingle();

    if (errorExiste) throw errorExiste;
    if (existe) {
      return res.status(400).json({ message: "El producto ya está en favoritos." });
    }

    // Insertar nuevo favorito
    const { data: insertado, error: insertError } = await supabase
      .from("favoritoproducto")
      .insert([
        {
          fechaagregado: new Date().toISOString().split("T")[0],
          cedula,
          idproducto,
        },
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    res.status(201).json({
      message: "Producto agregado a favoritos correctamente.",
      favorito: insertado,
    });
  } catch (error) {
    console.error("❌ Error al agregar favorito:", error.message);
    res.status(500).json({ message: "Error interno al agregar favorito." });
  }
});

// ====================================================================
// ❌ Eliminar un producto de favoritos
// ====================================================================
router.delete("/favoritos/:cedula/:idproducto", async (req, res) => {
  const { cedula, idproducto } = req.params;

  try {
    const { data, error } = await supabase
      .from("favoritoproducto")
      .delete()
      .eq("cedula", cedula)
      .eq("idproducto", idproducto)
      .select("*");

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ message: "El producto no estaba en favoritos." });
    }

    res.status(200).json({ message: "Producto eliminado de favoritos correctamente." });
  } catch (error) {
    console.error("❌ Error al eliminar favorito:", error.message);
    res.status(500).json({ message: "Error al eliminar favorito" });
  }
});



// --------------------------------------------------------------------
// 👤 PERFIL DE USUARIO AUTENTICADO
// --------------------------------------------------------------------
router.get("/usuario/perfil", verificarToken, async (req, res) => {
  const cedula = req.usuario.id; // 👈 viene del token JWT

  try {
    const { data, error } = await supabase
      .from("usuario")
      .select("cedula, nombre, apellido, direccion, ciudad, email, rol")
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

// --------------------------------------------------------------------
// 📊 ESTADÍSTICAS DE VENTAS MENSUALES
// --------------------------------------------------------------------
router.get("/estadisticas/ventas-mensuales", verificarToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("pedido")
      .select("fechaelaboracionpedido, idpedido");

    if (error) throw error;

    const { data: detalles, error: errorDetalles } = await supabase
      .from("detallepedidomm")
      .select("idpedido, subtotal");

    if (errorDetalles) throw errorDetalles;

    // Combinar pedidos y detalles
    const ventasPorMes = {};

    detalles.forEach((detalle) => {
      const pedido = data.find((p) => p.idpedido === detalle.idpedido);
      if (pedido) {
        const fecha = new Date(pedido.fechaelaboracionpedido);
        const mes = fecha.toLocaleString("es-ES", { month: "short", year: "numeric" });
        ventasPorMes[mes] = (ventasPorMes[mes] || 0) + Number(detalle.subtotal);
      }
    });

    const resultado = Object.entries(ventasPorMes).map(([mes, total]) => ({ mes, total }));

    res.json(resultado);
  } catch (err) {
    console.error("❌ Error al obtener ventas mensuales:", err.message);
    res.status(500).json({ error: "Error al obtener ventas mensuales" });
  }
});

// --------------------------------------------------------------------
// 🍰 PRODUCTOS MÁS VENDIDOS (TOP 5)
// --------------------------------------------------------------------
router.get("/estadisticas/productos-mas-vendidos", verificarToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("detallepedidomm")
      .select("cantidad, producto:producto(nombre)");

    if (error) throw error;

    const contador = {};
    data.forEach((d) => {
      const nombre = d.producto?.nombre || "Desconocido";
      contador[nombre] = (contador[nombre] || 0) + d.cantidad;
    });

    const top = Object.entries(contador)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    res.json(top);
  } catch (err) {
    console.error("❌ Error al obtener productos más vendidos:", err.message);
    res.status(500).json({ error: "Error al obtener productos más vendidos" });
  }
});

// --------------------------------------------------------------------
// 👥 USUARIOS POR TIPO (ROL)
// --------------------------------------------------------------------
router.get("/estadisticas/usuarios", verificarToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("usuario")
      .select("rol");

    if (error) throw error;

    // Agrupar por rol
    const conteo = {};
    data.forEach((u) => {
      const tipo = u.rol || "sin rol";
      conteo[tipo] = (conteo[tipo] || 0) + 1;
    });

    const result = Object.entries(conteo).map(([tipo, cantidad]) => ({
      tipo,
      cantidad,
    }));

    res.json(result);
  } catch (err) {
    console.error("Error al obtener usuarios:", err.message);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

// --------------------------------------------------------------------
// 📦 ESTADOS DE PEDIDOS
// --------------------------------------------------------------------
router.get("/estadisticas/estados-pedidos", verificarToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("pedido")
      .select(`
        idpedido,
        estadopedido (descripcion)
      `);

    if (error) throw error;

    // Contar por estado
    const conteo = {};
    data.forEach((p) => {
      const estado = p.estadopedido?.descripcion || "Desconocido";
      conteo[estado] = (conteo[estado] || 0) + 1;
    });

    const result = Object.entries(conteo)
      .map(([estado, cantidad]) => ({ estado, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);

    res.json(result);
  } catch (err) {
    console.error("Error al obtener estados de pedido:", err.message);
    res.status(500).json({ error: "Error al obtener estados de pedido" });
  }
});

export default router;