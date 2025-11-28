import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../config/db.js";
import { verificarToken } from "../controller/authMiddleware.js";
import { supabase as supabaseDB } from "../config/supabase.js";
import busboy from "busboy";
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
        rol: usuario.rol
      }
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

// ======================= CATEGORÍAS =========================

// GET /api/categorias  → lista todas las categorías
router.get("/categorias", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("categoria")
      .select("idcategoria, descripcionCategoria"); // 👈 nombre correcto

    if (error) throw error;

    return res.status(200).json(data);
  } catch (err) {
    console.error("❌ Error al obtener categorías:", err.message);
    return res
      .status(500)
      .json({ message: "Error al obtener categorías", error: err.message });
  }
});

// POST /api/categorias  → crea categoría nueva
router.post("/categorias", async (req, res) => {
  try {
    const { descripcionCategoria } = req.body;

    if (!descripcionCategoria || !descripcionCategoria.trim()) {
      return res
        .status(400)
        .json({ message: "La descripción de la categoría es obligatoria" });
    }

    const { data, error } = await supabase
      .from("categoria")
      .insert([{ descripcionCategoria: descripcionCategoria.trim() }])
      .select("idcategoria, descripcionCategoria")
      .single();

    if (error) throw error;

    return res.status(201).json(data);
  } catch (err) {
    console.error("❌ Error al crear categoría:", err.message);
    return res
      .status(500)
      .json({ message: "Error al crear categoría", error: err.message });
  }
});

// ========================= MARCAS ==========================

// GET /api/marcas  → lista todas las marcas
router.get("/marcas", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("marca")
      .select("idmarca, descripcionMarca"); // 👈 nombre correcto

    if (error) throw error;

    return res.status(200).json(data);
  } catch (err) {
    console.error("❌ Error al obtener marcas:", err.message);
    return res
      .status(500)
      .json({ message: "Error al obtener marcas", error: err.message });
  }
});

// POST /api/marcas  → crea una nueva marca
router.post("/marcas", async (req, res) => {
  try {
    const { descripcionMarca } = req.body;

    if (!descripcionMarca || !descripcionMarca.trim()) {
      return res
        .status(400)
        .json({ message: "La descripción de la marca es obligatoria" });
    }

    const { data, error } = await supabase
      .from("marca")
      .insert([{ descripcionMarca: descripcionMarca.trim() }])
      .select("idmarca, descripcionMarca")
      .single();

    if (error) throw error;

    return res.status(201).json(data);
  } catch (err) {
    console.error("❌ Error al crear marca:", err.message);
    return res
      .status(500)
      .json({ message: "Error al crear marca", error: err.message });
  }
});


// ====================================================================
// 🧾 OBTENER UN PRODUCTO POR ID
// ====================================================================
router.get("/productos/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    const { data: producto, error } = await supabaseDB
      .from("producto")
      .select(`
        idproducto,
        nombre,
        precio,
        stock,
        descripcion,
        idcategoria,
        idmarca,
        activo,
        producto_imagen (
          idimagen,
          url
        )
      `)
      .eq("idproducto", id)
      .eq("activo", true)  // ← ¡AGREGA ESTE FILTRO!
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      throw error;
    }

    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json(producto);
  } catch (err) {
    console.error("❌ Error al obtener producto:", err);
    res.status(500).json({ message: "Error al obtener producto" });
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
    // 1️⃣ Obtener items del carrito
    const { data: carritoItems, error: errCarrito } = await supabase
      .from("carrito")
      .select("idproducto, cantidad")
      .eq("cedula", cedula);

    if (errCarrito) throw errCarrito;
    if (!carritoItems || carritoItems.length === 0) {
      return res.status(200).json([]);
    }

    const ids = carritoItems.map(i => i.idproducto);

    // 2️⃣ Traer productos (SIN imagen_url)
    const { data: productos, error: errProductos } = await supabase
      .from("producto")
      .select("idproducto, nombre, precio, descripcion, stock")
      .in("idproducto", ids);

    if (errProductos) throw errProductos;

    // 3️⃣ Traer imágenes desde producto_imagen
    const { data: imagenes, error: errImagenes } = await supabase
      .from("producto_imagen")
      .select("idproducto, url")
      .in("idproducto", ids);

    if (errImagenes) throw errImagenes;

    // 4️⃣ Unir imágenes con productos
    const prodConImagenes = productos.map(p => {
      const imgs = imagenes.filter(i => i.idproducto === p.idproducto);
      return {
        ...p,
        imagenes: imgs.map(i => i.url)
      };
    });

    // 5️⃣ Construir respuesta final
    const carrito = carritoItems.map(item => {
      const prod = prodConImagenes.find(p => p.idproducto === item.idproducto);
      return {
        idproducto: item.idproducto,
        nombre: prod?.nombre,
        precio: prod?.precio,
        cantidad: item.cantidad,
        subtotal: prod?.precio * item.cantidad,
        imagen_url: prod?.imagenes?.[0] || null // ✅ Usamos la primera imagen
      };
    });

    return res.status(200).json(carrito);

  } catch (error) {
    console.error("❌ Error al obtener carrito:", error);
    res.status(500).json({ message: "Error al obtener carrito" });
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

router.put("/carrito/actualizar", async (req, res) => {
  const supabase = req.supabase; // ⬅️ Asegúrate de que esto exista
  const cedula = req.usuario.id;
  const { idproducto, cantidad } = req.body;

  try {
    if (!idproducto || cantidad < 1) {
      return res.status(400).json({
        message: "Datos inválidos"
      });
    }

    const { error: errorUpdate } = await supabase
      .from("carrito")
      .update({ cantidad })
      .eq("idproducto", idproducto)
      .eq("cedula", cedula);

    if (errorUpdate) {
      return res.status(500).json({ message: "Error al actualizar" });
    }

    const { data: carrito, error: errorCarrito } = await supabase
      .from("carrito")
      .select("*")
      .eq("cedula", cedula);

    if (errorCarrito) {
      return res.status(500).json({ message: "Error cargando carrito" });
    }

    return res.json({
      message: "Cantidad actualizada correctamente",
      carrito
    });

  } catch (error) {
    console.error("❌ Error al actualizar carrito:", error);
    res.status(500).json({
      message: "Error interno del servidor"
    });
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


router.get("/estadisticas/ventas-mensuales", verificarToken, async (req, res) => {
  try {
    // Traer todos los detalles con el id del pedido y subtotal
    const { data: detalles, error: errorDetalles } = await supabase
      .from("detallepedidomm")
      .select("idpedido, subtotal");

    if (errorDetalles) throw errorDetalles;

    // Traer todos los pedidos con fecha
    const { data: pedidos, error: errorPedidos } = await supabase
      .from("pedido")
      .select("idpedido, fechaelaboracionpedido");

    if (errorPedidos) throw errorPedidos;

    // Combinar pedidos y detalles
    const ventasPorMes = {};

    detalles.forEach(detalle => {
      const pedido = pedidos.find(p => p.idpedido === detalle.idpedido);
      if (pedido) {
        const fecha = new Date(pedido.fechaelaboracionpedido);
        const mes = fecha.toLocaleString("es-ES", { month: "short", year: "numeric" });
        ventasPorMes[mes] = (ventasPorMes[mes] || 0) + Number(detalle.subtotal);
      }
    });

    const resultado = Object.entries(ventasPorMes).map(([mes, total]) => ({ mes, total }));

    res.json(resultado);
  } catch (err) {
    console.error("❌ Error al obtener ventas mensuales:", err);
    res.status(500).json({ error: "Error al obtener ventas mensuales" });
  }
});

// ====================================================================
// 👥 Usuarios por tipo (rol)
// ====================================================================
router.get("/estadisticas/usuarios", verificarToken, async (req, res) => {
  try {
    const { data: usuarios, error } = await supabase
      .from("usuario")
      .select("rol");

    if (error) throw error;

    const conteo = usuarios.reduce((acc, u) => {
      const rol = u.rol || "sin rol";
      acc[rol] = (acc[rol] || 0) + 1;
      return acc;
    }, {});

    const resultado = Object.entries(conteo).map(([tipo, cantidad]) => ({ tipo, cantidad }));

    res.json(resultado);
  } catch (err) {
    console.error("Error al obtener usuarios:", err);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

// ====================================================================
// 📦 Estados de pedido
// ====================================================================
router.get("/estadisticas/estados-pedidos", verificarToken, async (req, res) => {
  try {
    const { data: pedidos, error: errorPedidos } = await supabase
      .from("pedido")
      .select("idestadopedido");

    if (errorPedidos) throw errorPedidos;

    const { data: estados, error: errorEstados } = await supabase
      .from("estadopedido")
      .select("idestadopedido, descripcion");

    if (errorEstados) throw errorEstados;

    const conteo = estados.map(e => ({
      estado: e.descripcion,
      cantidad: pedidos.filter(p => p.idestadopedido === e.idestadopedido).length,
    }));

    res.json(conteo);
  } catch (err) {
    console.error("Error al obtener estados de pedido:", err);
    res.status(500).json({ error: "Error al obtener estados de pedido" });
  }
});


// Ruta para obtener productos con sus imágenes - SIN imagen_url
// ========== RUTAS COMPLETAS PARA PRODUCTOS ==========

// GET - Obtener todos los productos con imágenes
// GET - Obtener todos los productos con imágenes (MODIFICAR ESTE)
router.get("/productos", async (req, res) => {
  try {
    const { search, soloActivos } = req.query;
    
    let query = supabaseDB
      .from("producto")
      .select(`
        idproducto,
        nombre,
        precio,
        stock,
        descripcion,
        idcategoria,
        idmarca,
        activo,
        producto_imagen (
          idimagen,
          url
        )
      `);

    // ✅ SIEMPRE filtrar por activo = true en endpoints públicos
    query = query.eq('activo', true);

    // Si hay búsqueda, agregar filtro de búsqueda
    if (search) {
      query = query.or(`nombre.ilike.%${search}%,descripcion.ilike.%${search}%`);
    }

    query = query.order('idproducto', { ascending: false });

    const { data: productos, error } = await query;

    if (error) {
      console.error("❌ Error de Supabase:", error);
      return res.status(500).json({ 
        message: "Error al obtener productos",
        error: error.message 
      });
    }

    console.log(`✅ Productos activos obtenidos: ${productos?.length || 0}`);
    res.json(productos);
  } catch (err) {
    console.error("❌ Error al obtener productos:", err);
    res.status(500).json({ 
      message: "Error al obtener productos",
      error: err.message 
    });
  }
});

// GET - Obtener un producto específico por ID
router.get("/productos/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    const { data: producto, error } = await supabaseDB
      .from("producto")
      .select(`
        idproducto,
        nombre,
        precio,
        stock,
        descripcion,
        idcategoria,
        idmarca,
        activo,
        producto_imagen (
          idimagen,
          url
        )
      `)
      .eq("idproducto", id)
      .eq("activo", true)
      .single();

    if (error) throw error;

    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json(producto);
  } catch (err) {
    console.error("❌ Error al obtener producto:", err);
    res.status(500).json({ message: "Error al obtener producto" });
  }
});

// POST - Crear producto con imágenes
router.post("/productos/con-imagen", (req, res) => {
  const bb = busboy({ headers: req.headers });
  const campos = {};
  const files = [];

  bb.on("file", (name, file, info) => {
    const { filename, mimeType } = info;
    const chunks = [];
    
    file.on("data", (chunk) => chunks.push(chunk));
    file.on("end", () => {
      const fileBuffer = Buffer.concat(chunks);
      files.push({
        name: name,
        filename: filename,
        mimeType: mimeType,
        buffer: fileBuffer
      });
      console.log("Archivo recibido:", filename, "tamaño:", fileBuffer.length);
    });
  });

  bb.on("field", (name, val) => {
    campos[name] = val;
  });

  bb.on("close", async () => {
    try {
      const imageUrls = [];

      // Subir cada imagen a Supabase Storage
      for (const file of files) {
        if (file.buffer) {
          const { data: uploadData, error: uploadError } = await supabaseDB.storage
            .from("productos")
            .upload(`productos/${Date.now()}_${file.filename}`, file.buffer, { 
              contentType: file.mimeType, 
              upsert: true 
            });

          if (uploadError) {
            console.error("Error al subir a Supabase:", uploadError);
            throw uploadError;
          }

          const publicURL = supabaseDB.storage
            .from("productos")
            .getPublicUrl(uploadData.path).data.publicUrl;

          imageUrls.push(publicURL);
          console.log("Archivo subido a Supabase, URL pública:", publicURL);
        }
      }

      // Insertar producto en la tabla producto
      const { data: productoCreado, error: errorInsert } = await supabaseDB
        .from("producto")
        .insert([{
          nombre: campos.nombre,
          descripcion: campos.descripcion || "",
          precio: Number(campos.precio),
          stock: Number(campos.stock),
          idcategoria: Number(campos.idcategoria),
          idmarca: campos.idmarca ? Number(campos.idmarca) : null,
        }])
        .select(`
          idproducto,
          nombre,
          precio,
          stock,
          descripcion,
          idcategoria,
          idmarca,
          activo
        `)
        .single();

      if (errorInsert) {
        console.error("Error al insertar producto en DB:", errorInsert);
        throw errorInsert;
      }

      // Insertar imágenes en la tabla producto_imagen
      if (imageUrls.length > 0) {
        const imagenesData = imageUrls.map((url) => ({
          idproducto: productoCreado.idproducto,
          url: url
        }));

        const { data: imagenesCreadas, error: errorImagenes } = await supabaseDB
          .from("producto_imagen")
          .insert(imagenesData)
          .select();

        if (errorImagenes) {
          console.error("Error al insertar imágenes en DB:", errorImagenes);
          throw errorImagenes;
        }

        // Agregar las imágenes al producto que retornamos
        productoCreado.producto_imagen = imagenesCreadas;
      }

      res.status(201).json({ 
        producto: productoCreado,
        message: `Producto creado con ${imageUrls.length} imágenes`
      });
    } catch (err) {
      console.error("❌ Error al crear producto:", err);
      res.status(500).json({ 
        message: err.message || "Error desconocido al crear producto", 
        stack: err.stack 
      });
    }
  });

  req.pipe(bb);
});

// PUT - Editar producto con imágenes
router.put("/productos/:id/con-imagen", (req, res) => {
  const { id } = req.params;
  const bb = busboy({ headers: req.headers });
  const campos = {};
  const files = [];

  bb.on("file", (name, file, info) => {
    const { filename, mimeType } = info;
    const chunks = [];
    
    file.on("data", (chunk) => chunks.push(chunk));
    file.on("end", () => {
      const fileBuffer = Buffer.concat(chunks);
      files.push({
        name: name,
        filename: filename,
        mimeType: mimeType,
        buffer: fileBuffer
      });
    });
  });

  bb.on("field", (name, val) => {
    campos[name] = val;
  });

  bb.on("close", async () => {
    try {
      const imageUrls = [];

      // Subir nuevas imágenes a Supabase Storage
      for (const file of files) {
        if (file.buffer) {
          const { data: uploadData, error: uploadError } = await supabaseDB.storage
            .from("productos")
            .upload(`productos/${Date.now()}_${file.filename}`, file.buffer, { 
              contentType: file.mimeType, 
              upsert: true 
            });

          if (uploadError) throw uploadError;

          const publicURL = supabaseDB.storage
            .from("productos")
            .getPublicUrl(uploadData.path).data.publicUrl;

          imageUrls.push(publicURL);
        }
      }

      // Actualizar producto en la tabla producto
      const { data: productoActualizado, error: errorUpdate } = await supabaseDB
        .from("producto")
        .update({
          nombre: campos.nombre,
          descripcion: campos.descripcion,
          precio: Number(campos.precio),
          stock: Number(campos.stock),
          idcategoria: Number(campos.idcategoria),
          idmarca: campos.idmarca ? Number(campos.idmarca) : null,
        })
        .eq("idproducto", id)
        .select(`
          idproducto,
          nombre,
          precio,
          stock,
          descripcion,
          idcategoria,
          idmarca,
          activo
        `)
        .single();

      if (errorUpdate) throw errorUpdate;

      // Si hay nuevas imágenes, eliminar las antiguas y agregar las nuevas
      if (imageUrls.length > 0) {
        // Eliminar imágenes existentes del producto
        const { error: deleteError } = await supabaseDB
          .from("producto_imagen")
          .delete()
          .eq("idproducto", id);

        if (deleteError) throw deleteError;

        // Insertar nuevas imágenes
        const imagenesData = imageUrls.map((url) => ({
          idproducto: id,
          url: url
        }));

        const { data: imagenesCreadas, error: errorImagenes } = await supabaseDB
          .from("producto_imagen")
          .insert(imagenesData)
          .select();

        if (errorImagenes) throw errorImagenes;

        // Agregar las imágenes al producto que retornamos
        productoActualizado.producto_imagen = imagenesCreadas;
      } else {
        // Si no hay nuevas imágenes, obtener las existentes
        const { data: imagenesExistentes } = await supabaseDB
          .from("producto_imagen")
          .select("*")
          .eq("idproducto", id);

        productoActualizado.producto_imagen = imagenesExistentes || [];
      }

      res.status(200).json({ 
        producto: productoActualizado,
        message: imageUrls.length > 0 ? `Producto actualizado con ${imageUrls.length} nuevas imágenes` : 'Producto actualizado (sin cambios en imágenes)'
      });
    } catch (err) {
      console.error("❌ Error al editar producto:", err);
      res.status(500).json({ message: "Error al editar producto" });
    }
  });

  req.pipe(bb);
});

// PATCH - Activar/Desactivar producto
router.patch("/productos/:id/estado", async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;

  try {
    const { data: productoActualizado, error } = await supabaseDB
      .from("producto")
      .update({ activo: activo })
      .eq("idproducto", id)
      .select(`
        idproducto,
        nombre,
        precio,
        stock,
        descripcion,
        idcategoria,
        idmarca,
        activo
      `)
      .single();

    if (error) throw error;

    res.json({ 
      producto: productoActualizado,
      message: `Producto ${activo ? 'activado' : 'desactivado'} correctamente`
    });
  } catch (err) {
    console.error("❌ Error al cambiar estado del producto:", err);
    res.status(500).json({ message: "Error al cambiar estado del producto" });
  }
});

// DELETE - Eliminar producto
router.delete("/productos/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Obtener imágenes del producto para eliminarlas del storage
    const { data: imagenes } = await supabaseDB
      .from("producto_imagen")
      .select("url")
      .eq("idproducto", id);

    // Eliminar imágenes del storage (opcional)
    if (imagenes && imagenes.length > 0) {
      const filePaths = imagenes.map(img => {
        const urlParts = img.url.split('/');
        return `productos/${urlParts[urlParts.length - 1]}`;
      });

      const { error: storageError } = await supabaseDB.storage
        .from("productos")
        .remove(filePaths);

      if (storageError) {
        console.error("Error al eliminar imágenes del storage:", storageError);
        // No lanzamos error aquí para no impedir la eliminación del producto
      }
    }

    // Primero eliminar las imágenes de la tabla producto_imagen
    const { error: deleteImagenesError } = await supabaseDB
      .from("producto_imagen")
      .delete()
      .eq("idproducto", id);

    if (deleteImagenesError) throw deleteImagenesError;

    // Luego eliminar el producto
    const { error: deleteError } = await supabaseDB
      .from("producto")
      .delete()
      .eq("idproducto", id);

    if (deleteError) throw deleteError;

    res.status(200).json({ message: "Producto e imágenes eliminados correctamente" });
  } catch (err) {
    console.error("❌ Error al eliminar producto:", err);
    res.status(500).json({ message: "Error al eliminar producto" });
  }
});

// GET - Obtener solo las imágenes de un producto específico
router.get("/productos/:id/imagenes", async (req, res) => {
  const { id } = req.params;
  
  try {
    const { data: imagenes, error } = await supabaseDB
      .from("producto_imagen")
      .select("*")
      .eq("idproducto", id);

    if (error) throw error;

    res.json(imagenes);
  } catch (err) {
    console.error("❌ Error al obtener imágenes del producto:", err);
    res.status(500).json({ message: "Error al obtener imágenes" });
  }
});

// POST - Crear producto sin imágenes (opcional)
router.post("/productos", async (req, res) => {
  try {
    const { nombre, precio, stock, descripcion, idcategoria, idmarca } = req.body;

    const { data: productoCreado, error } = await supabaseDB
      .from("producto")
      .insert([{
        nombre,
        descripcion: descripcion || "",
        precio: Number(precio),
        stock: Number(stock),
        idcategoria: Number(idcategoria),
        idmarca: idmarca ? Number(idmarca) : null,
      }])
      .select(`
        idproducto,
        nombre,
        precio,
        stock,
        descripcion,
        idcategoria,
        idmarca,
        activo
      `)
      .single();

    if (error) throw error;

    res.status(201).json({ 
      producto: productoCreado,
      message: "Producto creado correctamente"
    });
  } catch (err) {
    console.error("❌ Error al crear producto:", err);
    res.status(500).json({ message: "Error al crear producto" });
  }
});

// PUT - Editar producto sin imágenes (opcional)
router.put("/productos/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, precio, stock, descripcion, idcategoria, idmarca } = req.body;

  try {
    const { data: productoActualizado, error } = await supabaseDB
      .from("producto")
      .update({
        nombre,
        descripcion,
        precio: Number(precio),
        stock: Number(stock),
        idcategoria: Number(idcategoria),
        idmarca: idmarca ? Number(idmarca) : null,
      })
      .eq("idproducto", id)
      .select(`
        idproducto,
        nombre,
        precio,
        stock,
        descripcion,
        idcategoria,
        idmarca,
        activo
      `)
      .single();

    if (error) throw error;

    res.json({ 
      producto: productoActualizado,
      message: "Producto actualizado correctamente"
    });
  } catch (err) {
    console.error("❌ Error al editar producto:", err);
    res.status(500).json({ message: "Error al editar producto" });
  }
});

// ================================================================
// 📦 RUTAS DE CATEGORÍAS Y PRODUCTOS POR CATEGORÍA
// ================================================================

// ✅ Obtener todas las categorías
router.get("/categorias", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("categoria")
      .select("idcategoria, descripcion")
      .order("descripcion", { ascending: true });

    if (error) {
      console.error("❌ Error Supabase:", error);
      return res.status(500).json({ message: "Error al obtener categorías" });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("❌ Error servidor:", error);
    res.status(500).json({ message: "Error al obtener categorías" });
  }
});

// ✅ Obtener productos de una categoría específica
router.get("/categorias/:idcategoria/productos", async (req, res) => {
  const { idcategoria } = req.params;

  try {
    const { data, error } = await supabase
      .from("producto")
      .select(`
        idproducto,
        nombre,
        precio,
        stock,
        descripcion,
        idcategoria,
        activo,
        producto_imagen(url)
      `)
      .eq("idcategoria", idcategoria)
      .eq("activo", true)
      .order("nombre", { ascending: true });

    if (error) {
      console.log("❌ Error supabase:", error);
      return res.status(500).json({ message: "Error al obtener productos" });
    }

    if (!data || data.length === 0) {
      return res.status(404).json([]);
    }

    const productos = data.map((p) => ({
      idproducto: p.idproducto,
      nombre: p.nombre,
      precio: p.precio,
      stock: p.stock,
      descripcion: p.descripcion,
      idcategoria: p.idcategoria,
      producto_imagen: p.producto_imagen || [],
      activo: p.activo,
    }));

    res.status(200).json(productos);
  } catch (err) {
    console.log("❌ Error servidor:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// ====================================================================
// 📋 OBTENER TODOS LOS PRODUCTOS (INCLUYENDO DESACTIVADOS) - SOLO ADMIN
// ====================================================================
router.get("/admin/productos", verificarToken, async (req, res) => {
  try {
    console.log("🔍 [ADMIN] Obteniendo todos los productos (incluyendo desactivados)...");
    
    const { data: productos, error } = await supabaseDB
      .from("producto")
      .select(`
        idproducto,
        nombre,
        precio,
        stock,
        descripcion,
        idcategoria,
        idmarca,
        activo,
        producto_imagen (
          idimagen,
          url
        )
      `)
      .order('idproducto', { ascending: false });

    if (error) {
      console.error("❌ [ADMIN] Error al obtener productos:", error);
      return res.status(500).json({ 
        message: "Error al obtener productos",
        error: error.message 
      });
    }

    console.log(`✅ [ADMIN] Productos obtenidos: ${productos?.length || 0}`);
    
    res.json(productos);
  } catch (err) {
    console.error("❌ [ADMIN] Error al obtener productos:", err);
    res.status(500).json({ 
      message: "Error al obtener productos",
      error: err.message 
    });
  }
});

export default router;
