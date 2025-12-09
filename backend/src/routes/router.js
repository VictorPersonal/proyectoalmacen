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
   HELPERS GENERALES
========================================================= */

// Traduce el idestadopedido a texto
const traducirEstado = (idEstado) => {
  const estados = {
    1: "Pendiente",
    2: "Pagado",
    3: "En camino",
    4: "Entregado",
    5: "Cancelado",
  };
  return estados[idEstado] || "Desconocido";
};

// Convierte texto de estado a idestadopedido
const estadoTextoAId = (estadoTexto) => {
  if (typeof estadoTexto === "number") return estadoTexto;
  if (!estadoTexto) return null;

  const mapa = {
    pendiente: 1,
    pagado: 2,
    "en camino": 3,
    entregado: 4,
    cancelado: 5,
  };

  const clave = estadoTexto.toString().trim().toLowerCase();
  return mapa[clave] || null;
};

/* =========================================================
   TEST ROUTER
========================================================= */

router.get("/ping", (req, res) => {
  res.json({ ok: true, mensaje: "Router principal funcionando" });
});

/* =========================================================
   AUTENTICACIÓN Y USUARIOS
========================================================= */

// Registro de usuario
router.post("/usuario", async (req, res) => {
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
router.post("/login", async (req, res) => {
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
router.get("/usuario/perfil", verificarToken, async (req, res) => {
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
router.put("/usuario/perfil", verificarToken, async (req, res) => {
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

/* =========================================================
   CATEGORÍAS
========================================================= */

router.get("/categorias", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("categoria")
      .select("idcategoria, descripcionCategoria")
      .order("descripcionCategoria", { ascending: true });

    if (error) throw error;

    res.status(200).json(data);
  } catch (err) {
    console.error("❌ Error al obtener categorías:", err.message);
    res
      .status(500)
      .json({ message: "Error al obtener categorías", error: err.message });
  }
});

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

    res.status(201).json(data);
  } catch (err) {
    console.error("❌ Error al crear categoría:", err.message);
    res
      .status(500)
      .json({ message: "Error al crear categoría", error: err.message });
  }
});

// Productos por categoría
router.get("/categorias/:idcategoria/productos", async (req, res) => {
  const { idcategoria } = req.params;

  try {
    const { data, error } = await supabaseDB
      .from("producto")
      .select(`
        idproducto,
        nombre,
        precio,
        stock,
        descripcion,
        idcategoria,
        activo,
        producto_imagen (url)
      `)
      .eq("idcategoria", idcategoria)
      .eq("activo", true)
      .order("nombre", { ascending: true });

    if (error) throw error;

    const productos = (data || []).map((p) => ({
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
    console.error("❌ Error al obtener productos por categoría:", err);
    res.status(500).json({ message: "Error al obtener productos" });
  }
});

/* =========================================================
   MARCAS
========================================================= */

router.get("/marcas", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("marca")
      .select("idmarca, descripcionMarca");

    if (error) throw error;

    res.status(200).json(data);
  } catch (err) {
    console.error("❌ Error al obtener marcas:", err.message);
    res
      .status(500)
      .json({ message: "Error al obtener marcas", error: err.message });
  }
});

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

    res.status(201).json(data);
  } catch (err) {
    console.error("❌ Error al crear marca:", err.message);
    res
      .status(500)
      .json({ message: "Error al crear marca", error: err.message });
  }
});

/* =========================================================
   PRODUCTOS - PÚBLICO (LISTA + DETALLE)
========================================================= */

// Lista de productos (solo activos, con imágenes, opcional search)
router.get("/productos", async (req, res) => {
  try {
    const { search } = req.query;

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
      `)
      .eq("activo", true)
      .order("idproducto", { ascending: false });

    if (search) {
      query = query.or(
        `nombre.ilike.%${search}%,descripcion.ilike.%${search}%`
      );
    }

    const { data: productos, error } = await query;

    if (error) throw error;

    res.json(productos || []);
  } catch (err) {
    console.error("❌ Error al obtener productos:", err);
    res
      .status(500)
      .json({ message: "Error al obtener productos", error: err.message });
  }
});

// Obtener un producto específico por ID (solo activos)
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

// Solo imágenes de un producto
router.get("/productos/:id/imagenes", async (req, res) => {
  const { id } = req.params;

  try {
    const { data: imagenes, error } = await supabaseDB
      .from("producto_imagen")
      .select("*")
      .eq("idproducto", id);

    if (error) throw error;

    res.json(imagenes || []);
  } catch (err) {
    console.error("❌ Error al obtener imágenes del producto:", err);
    res.status(500).json({ message: "Error al obtener imágenes" });
  }
});

/* =========================================================
   PRODUCTOS - ADMIN (CREAR / EDITAR / ESTADO / ELIMINAR)
========================================================= */

// Crear producto con imágenes (multipart/form-data)
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
        name,
        filename,
        mimeType,
        buffer: fileBuffer,
      });
    });
  });

  bb.on("field", (name, val) => {
    campos[name] = val;
  });

  bb.on("close", async () => {
    try {
      const imageUrls = [];

      for (const file of files) {
        if (file.buffer) {
          const { data: uploadData, error: uploadError } = await supabaseDB
            .storage.from("productos")
            .upload(
              `productos/${Date.now()}_${file.filename}`,
              file.buffer,
              {
                contentType: file.mimeType,
                upsert: true,
              }
            );

          if (uploadError) throw uploadError;

          const publicURL = supabaseDB.storage
            .from("productos")
            .getPublicUrl(uploadData.path).data.publicUrl;

          imageUrls.push(publicURL);
        }
      }

      const { data: productoCreado, error: errorInsert } = await supabaseDB
        .from("producto")
        .insert([
          {
            nombre: campos.nombre,
            descripcion: campos.descripcion || "",
            precio: Number(campos.precio),
            stock: Number(campos.stock),
            idcategoria: Number(campos.idcategoria),
            idmarca: campos.idmarca ? Number(campos.idmarca) : null,
          },
        ])
        .select(
          `
          idproducto,
          nombre,
          precio,
          stock,
          descripcion,
          idcategoria,
          idmarca,
          activo
        `
        )
        .single();

      if (errorInsert) throw errorInsert;

      if (imageUrls.length > 0) {
        const imagenesData = imageUrls.map((url) => ({
          idproducto: productoCreado.idproducto,
          url,
        }));

        const { data: imagenesCreadas, error: errorImagenes } = await supabaseDB
          .from("producto_imagen")
          .insert(imagenesData)
          .select();

        if (errorImagenes) throw errorImagenes;

        productoCreado.producto_imagen = imagenesCreadas;
      }

      res.status(201).json({
        producto: productoCreado,
        message: `Producto creado con ${imageUrls.length} imágenes`,
      });
    } catch (err) {
      console.error("❌ Error al crear producto:", err);
      res.status(500).json({
        message: err.message || "Error desconocido al crear producto",
      });
    }
  });

  req.pipe(bb);
});

// Editar producto con imágenes
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
        name,
        filename,
        mimeType,
        buffer: fileBuffer,
      });
    });
  });

  bb.on("field", (name, val) => {
    campos[name] = val;
  });

  bb.on("close", async () => {
    try {
      const imageUrls = [];

      for (const file of files) {
        if (file.buffer) {
          const { data: uploadData, error: uploadError } = await supabaseDB
            .storage.from("productos")
            .upload(
              `productos/${Date.now()}_${file.filename}`,
              file.buffer,
              {
                contentType: file.mimeType,
                upsert: true,
              }
            );

          if (uploadError) throw uploadError;

          const publicURL = supabaseDB.storage
            .from("productos")
            .getPublicUrl(uploadData.path).data.publicUrl;

          imageUrls.push(publicURL);
        }
      }

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
        .select(
          `
          idproducto,
          nombre,
          precio,
          stock,
          descripcion,
          idcategoria,
          idmarca,
          activo
        `
        )
        .single();

      if (errorUpdate) throw errorUpdate;

      if (imageUrls.length > 0) {
        const { error: deleteError } = await supabaseDB
          .from("producto_imagen")
          .delete()
          .eq("idproducto", id);

        if (deleteError) throw deleteError;

        const imagenesData = imageUrls.map((url) => ({
          idproducto: id,
          url,
        }));

        const { data: imagenesCreadas, error: errorImagenes } = await supabaseDB
          .from("producto_imagen")
          .insert(imagenesData)
          .select();

        if (errorImagenes) throw errorImagenes;

        productoActualizado.producto_imagen = imagenesCreadas;
      } else {
        const { data: imagenesExistentes } = await supabaseDB
          .from("producto_imagen")
          .select("*")
          .eq("idproducto", id);

        productoActualizado.producto_imagen = imagenesExistentes || [];
      }

      res.status(200).json({
        producto: productoActualizado,
        message:
          imageUrls.length > 0
            ? `Producto actualizado con ${imageUrls.length} nuevas imágenes`
            : "Producto actualizado (sin cambios en imágenes)",
      });
    } catch (err) {
      console.error("❌ Error al editar producto:", err);
      res.status(500).json({ message: "Error al editar producto" });
    }
  });

  req.pipe(bb);
});

// Cambiar estado activo/inactivo
router.patch("/productos/:id/estado", async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;

  try {
    const { data: productoActualizado, error } = await supabaseDB
      .from("producto")
      .update({ activo })
      .eq("idproducto", id)
      .select(
        `
        idproducto,
        nombre,
        precio,
        stock,
        descripcion,
        idcategoria,
        idmarca,
        activo
      `
      )
      .single();

    if (error) throw error;

    res.json({
      producto: productoActualizado,
      message: `Producto ${
        activo ? "activado" : "desactivado"
      } correctamente`,
    });
  } catch (err) {
    console.error("❌ Error al cambiar estado del producto:", err);
    res.status(500).json({ message: "Error al cambiar estado del producto" });
  }
});

// Eliminar producto (y sus imágenes)
router.delete("/productos/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { data: imagenes } = await supabaseDB
      .from("producto_imagen")
      .select("url")
      .eq("idproducto", id);

    if (imagenes && imagenes.length > 0) {
      const filePaths = imagenes.map((img) => {
        const urlParts = img.url.split("/");
        return `productos/${urlParts[urlParts.length - 1]}`;
      });

      const { error: storageError } = await supabaseDB.storage
        .from("productos")
        .remove(filePaths);

      if (storageError) {
        console.error("Error al eliminar imágenes del storage:", storageError);
      }
    }

    const { error: deleteImagenesError } = await supabaseDB
      .from("producto_imagen")
      .delete()
      .eq("idproducto", id);

    if (deleteImagenesError) throw deleteImagenesError;

    const { error: deleteError } = await supabaseDB
      .from("producto")
      .delete()
      .eq("idproducto", id);

    if (deleteError) throw deleteError;

    res
      .status(200)
      .json({ message: "Producto e imágenes eliminados correctamente" });
  } catch (err) {
    console.error("❌ Error al eliminar producto:", err);
    res.status(500).json({ message: "Error al eliminar producto" });
  }
});

// Listado admin de productos (incluye inactivos)
router.get("/admin/productos", verificarToken, async (req, res) => {
  try {
    const { data: productos, error } = await supabaseDB
      .from("producto")
      .select(
        `
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
      `
      )
      .order("idproducto", { ascending: false });

    if (error) throw error;

    res.json(productos || []);
  } catch (err) {
    console.error("❌ [ADMIN] Error al obtener productos:", err);
    res
      .status(500)
      .json({ message: "Error al obtener productos", error: err.message });
  }
});


// ====================================================================
// Helper: obtener carrito completo con producto y subtotal
// ====================================================================
async function obtenerCarritoCompleto(cedula) {
  try {
    const { data, error } = await supabase
      .from("carrito")
      .select(`
        idproducto,
        cantidad,
        producto:producto (
          nombre,
          precio,
          stock
        )
      `)
      .eq("cedula", cedula);

    if (error) throw error;

    const carritoConSubtotal = (data || []).map((item) => ({
      idproducto: item.idproducto,
      cantidad: item.cantidad,
      nombre: item.producto?.nombre || "Producto no encontrado",
      precio: item.producto?.precio || 0,
      stock: item.producto?.stock || 0,
      subtotal: (item.producto?.precio || 0) * item.cantidad,
    }));

    return carritoConSubtotal;
  } catch (error) {
    console.error("Error obteniendo carrito completo:", error);
    throw error;
  }
}

/* =========================================================
   CARRITO (RUTAS PROTEGIDAS)
========================================================= */

router.use("/carrito", verificarToken);

// Obtener carrito
router.get("/carrito", async (req, res) => {
  const cedula = req.usuario.id;

  try {
    const { data: carritoItems, error: errCarrito } = await supabase
      .from("carrito")
      .select("idproducto, cantidad")
      .eq("cedula", cedula);

    if (errCarrito) throw errCarrito;

    if (!carritoItems || carritoItems.length === 0) {
      return res.status(200).json([]);
    }

    const ids = carritoItems.map((i) => i.idproducto);

    const { data: productos, error: errProductos } = await supabase
      .from("producto")
      .select("idproducto, nombre, precio, descripcion, stock")
      .in("idproducto", ids);

    if (errProductos) throw errProductos;

    const { data: imagenes, error: errImagenes } = await supabase
      .from("producto_imagen")
      .select("idproducto, url")
      .in("idproducto", ids);

    if (errImagenes) throw errImagenes;

    const prodConImagenes = (productos || []).map((p) => {
      const imgs = (imagenes || []).filter(
        (i) => i.idproducto === p.idproducto
      );
      return {
        ...p,
        imagenes: imgs.map((i) => i.url),
      };
    });

    const carrito = carritoItems.map((item) => {
      const prod = prodConImagenes.find(
        (p) => p.idproducto === item.idproducto
      );
      return {
        idproducto: item.idproducto,
        nombre: prod?.nombre,
        precio: prod?.precio,
        cantidad: item.cantidad,
        subtotal: prod?.precio * item.cantidad,
        imagen_url: prod?.imagenes?.[0] || null,
      };
    });

    res.status(200).json(carrito);
  } catch (error) {
    console.error("❌ Error al obtener carrito:", error);
    res.status(500).json({ message: "Error al obtener carrito" });
  }
});

// Agregar / actualizar producto en carrito
router.post("/carrito/agregar", async (req, res) => {
  const cedula = req.usuario.id;
  const { idproducto, cantidad } = req.body;

  if (!idproducto || !cantidad) {
    return res
      .status(400)
      .json({ message: "Faltan datos: idproducto o cantidad" });
  }

  try {
    const { data: existe, error: existeError } = await supabase
      .from("carrito")
      .select("cantidad")
      .eq("cedula", cedula)
      .eq("idproducto", idproducto)
      .maybeSingle();

    if (existeError) throw existeError;

    if (existe) {
      const nuevaCantidad = existe.cantidad + cantidad;
      const { error: updateError } = await supabase
        .from("carrito")
        .update({ cantidad: nuevaCantidad })
        .eq("cedula", cedula)
        .eq("idproducto", idproducto);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from("carrito")
        .insert([{ cedula, idproducto, cantidad }]);

      if (insertError) throw insertError;
    }

    res
      .status(200)
      .json({ message: "Producto agregado correctamente al carrito" });
  } catch (error) {
    console.error("❌ Error al agregar producto al carrito:", error.message);
    res
      .status(500)
      .json({ message: "Error al agregar producto al carrito" });
  }
});

// ====================================================================
// ✏️ Actualizar cantidad en el carrito CON VALIDACIÓN DE STOCK
// ====================================================================
router.put("/carrito/actualizar", async (req, res) => {
  const cedula = req.usuario.id;
  const { idproducto, cantidad } = req.body;

  try {
    if (!idproducto || cantidad < 0) {
      return res.status(400).json({
        message:
          "Datos inválidos. Se requiere idproducto y una cantidad válida (>= 0).",
      });
    }

    // 1. Validar stock disponible
    const { data: productoData, error: productoError } = await supabase
      .from("producto")
      .select("stock, nombre")
      .eq("idproducto", idproducto)
      .single();

    if (productoError) throw productoError;
    if (!productoData) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    // 2. Validar que la cantidad no exceda el stock
    if (cantidad > productoData.stock) {
      return res.status(400).json({
        message: `Stock insuficiente. Solo hay ${productoData.stock} unidades disponibles de "${productoData.nombre}".`,
      });
    }

    // 3. Si cantidad es 0, eliminar del carrito
    if (cantidad === 0) {
      const { error: deleteError } = await supabase
        .from("carrito")
        .delete()
        .eq("idproducto", idproducto)
        .eq("cedula", cedula);

      if (deleteError) throw deleteError;

      return res.status(200).json({
        message: "Producto eliminado del carrito",
        carrito: await obtenerCarritoCompleto(cedula),
      });
    }

    // 4. Actualizar cantidad
    const { error: errorUpdate } = await supabase
      .from("carrito")
      .update({ cantidad })
      .eq("idproducto", idproducto)
      .eq("cedula", cedula);

    if (errorUpdate) throw errorUpdate;

    // 5. Obtener carrito actualizado
    const carrito = await obtenerCarritoCompleto(cedula);

    console.log(
      `✅ Carrito actualizado correctamente. Productos: ${carrito.length}`
    );

    return res.status(200).json({
      message: "Cantidad actualizada correctamente",
      carrito,
      stockRestante: productoData.stock - cantidad,
    });
  } catch (error) {
    console.error("❌ Error al actualizar carrito:", error);

    return res.status(500).json({
      message: "Error interno del servidor al actualizar el carrito",
      // Si quieres ocultar el detalle en producción, cambia esta lógica
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      hint: "Verifica la conexión con la base de datos y los datos enviados",
    });
  }
});


// Eliminar producto del carrito
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
      return res
        .status(404)
        .json({ message: "Producto no encontrado en el carrito" });
    }

    res
      .status(200)
      .json({ message: "Producto eliminado correctamente del carrito" });
  } catch (error) {
    console.error("❌ Error al eliminar producto del carrito:", error.message);
    res
      .status(500)
      .json({ message: "Error al eliminar producto del carrito" });
  }
});

// Vaciar carrito
router.delete("/carrito/vaciar", async (req, res) => {
  const cedula = req.usuario.id;

  try {
    const { error } = await supabase
      .from("carrito")
      .delete()
      .eq("cedula", cedula);

    if (error) throw error;

    res.status(200).json({ message: "Carrito vaciado exitosamente" });
  } catch (error) {
    console.error("❌ Error al vaciar carrito:", error.message);
    res.status(500).json({ message: "Error al vaciar carrito" });
  }
});

/* =========================================================
   FAVORITOS (RUTAS PROTEGIDAS)
========================================================= */

router.use("/favoritos", verificarToken);

// Obtener favoritos
router.get("/favoritos", async (req, res) => {
  try {
    const cedula = req.usuario.id;

    const { data: favoritosData, error } = await supabase
      .from("favoritoproducto")
      .select(
        `
        idfavorito,
        fechaagregado,
        producto:producto (
          idproducto,
          nombre,
          precio,
          descripcion,
          stock
        )
      `
      )
      .eq("cedula", cedula)
      .order("fechaagregado", { ascending: false });

    if (error) throw error;

    if (!favoritosData || favoritosData.length === 0) {
      return res.status(200).json([]);
    }

    const productosIds = favoritosData
      .map((f) => f.producto?.idproducto)
      .filter((id) => id != null);

    const { data: imagenesData, error: errorImagenes } = await supabase
      .from("producto_imagen")
      .select("idproducto, url")
      .in("idproducto", productosIds);

    if (errorImagenes) throw errorImagenes;

    const imagenesPorProducto = {};
    (imagenesData || []).forEach((img) => {
      if (!imagenesPorProducto[img.idproducto]) {
        imagenesPorProducto[img.idproducto] = [];
      }
      imagenesPorProducto[img.idproducto].push(img.url);
    });

    const favoritos = favoritosData.map((f) => ({
      idfavorito: f.idfavorito,
      fechaagregado: f.fechaagregado,
      idproducto: f.producto?.idproducto,
      nombre: f.producto?.nombre,
      precio: f.producto?.precio,
      descripcion: f.producto?.descripcion,
      stock: f.producto?.stock,
      imagenes: imagenesPorProducto[f.producto?.idproducto] || [],
      imagen:
        imagenesPorProducto[f.producto?.idproducto]?.[0] || null,
    }));

    res.status(200).json(favoritos);
  } catch (error) {
    console.error("❌ Error al obtener favoritos:", error.message);
    res.status(500).json({ message: "Error al obtener favoritos" });
  }
});

// Agregar favorito
router.post("/favoritos", async (req, res) => {
  const { idproducto } = req.body;
  const cedula = req.usuario.id;

  if (!idproducto) {
    return res.status(400).json({ message: "Falta el id del producto." });
  }

  try {
    const { data: productoExiste, error: errorProducto } = await supabase
      .from("producto")
      .select("idproducto")
      .eq("idproducto", idproducto)
      .maybeSingle();

    if (errorProducto) throw errorProducto;

    if (!productoExiste) {
      return res
        .status(404)
        .json({ message: `No existe un producto con el ID ${idproducto}.` });
    }

    const { data: existe, error: errorExiste } = await supabase
      .from("favoritoproducto")
      .select("idfavorito")
      .eq("cedula", cedula)
      .eq("idproducto", idproducto)
      .maybeSingle();

    if (errorExiste) throw errorExiste;

    if (existe) {
      return res
        .status(400)
        .json({ message: "El producto ya está en favoritos." });
    }

    const { data: insertado, error: insertError } = await supabase
      .from("favoritoproducto")
      .insert([
        {
          fechaagregado: new Date().toISOString(),
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

// Eliminar favorito
router.delete("/favoritos/:idproducto", async (req, res) => {
  const { idproducto } = req.params;
  const cedula = req.usuario.id;

  try {
    const { data, error } = await supabase
      .from("favoritoproducto")
      .delete()
      .eq("cedula", cedula)
      .eq("idproducto", idproducto)
      .select("*");

    if (error) throw error;

    if (!data || data.length === 0) {
      return res
        .status(404)
        .json({ message: "El producto no estaba en favoritos." });
    }

    res
      .status(200)
      .json({ message: "Producto eliminado de favoritos correctamente." });
  } catch (error) {
    console.error("❌ Error al eliminar favorito:", error.message);
    res.status(500).json({ message: "Error al eliminar favorito" });
  }
});

/* =========================================================
   ESTADÍSTICAS
========================================================= */

// Productos más vendidos
router.get("/estadisticas/productos-mas-vendidos", verificarToken, async (req, res) => {
  try {
    const tableNames = ["detallepedidomm", "detallepedidoMM", "detallepedido"];

    for (const tableName of tableNames) {
      const { data, error } = await supabase
        .from(tableName)
        .select(
          `
          cantidad,
          idproducto,
          producto:producto(idproducto, nombre)
        `
        );

      if (!error && data && data.length > 0) {
        const contador = {};

        data.forEach((d) => {
          const nombre =
            d.producto?.nombre || `Desconocido (ID: ${d.idproducto})`;
          contador[nombre] = (contador[nombre] || 0) + (d.cantidad || 0);
        });

        const top = Object.entries(contador)
          .map(([nombre, cantidad]) => ({ nombre, cantidad }))
          .sort((a, b) => b.cantidad - a.cantidad)
          .slice(0, 5);

        return res.json(top);
      }
    }

    return res.json([]);
  } catch (err) {
    console.error("❌ Error general:", err.message);
    res
      .status(500)
      .json({ error: "Error al obtener productos más vendidos" });
  }
});

// Ventas mensuales (sumando subtotales)
router.get("/estadisticas/ventas-mensuales", verificarToken, async (req, res) => {
  try {
    const { data: detalles, error: errorDetalles } = await supabase
      .from("detallepedidomm")
      .select("idpedido, subtotal");

    if (errorDetalles) throw errorDetalles;

    const { data: pedidos, error: errorPedidos } = await supabase
      .from("pedido")
      .select("idpedido, fechaelaboracionpedido");

    if (errorPedidos) throw errorPedidos;

    const ventasPorMes = {};

    (detalles || []).forEach((detalle) => {
      const pedido = pedidos.find((p) => p.idpedido === detalle.idpedido);
      if (pedido) {
        const fecha = new Date(pedido.fechaelaboracionpedido);
        const mes = fecha.toLocaleString("es-ES", {
          month: "short",
          year: "numeric",
        });
        ventasPorMes[mes] = (ventasPorMes[mes] || 0) + Number(detalle.subtotal);
      }
    });

    const resultado = Object.entries(ventasPorMes).map(([mes, total]) => ({
      mes,
      total,
    }));

    res.json(resultado);
  } catch (err) {
    console.error("❌ Error al obtener ventas mensuales:", err);
    res.status(500).json({ error: "Error al obtener ventas mensuales" });
  }
});

// Usuarios por tipo (rol)
router.get("/estadisticas/usuarios", verificarToken, async (req, res) => {
  try {
    const { data: usuarios, error } = await supabase
      .from("usuario")
      .select("rol");

    if (error) throw error;

    const conteo = (usuarios || []).reduce((acc, u) => {
      const rol = u.rol || "sin rol";
      acc[rol] = (acc[rol] || 0) + 1;
      return acc;
    }, {});

    const resultado = Object.entries(conteo).map(([tipo, cantidad]) => ({
      tipo,
      cantidad,
    }));

    res.json(resultado);
  } catch (err) {
    console.error("Error al obtener usuarios:", err);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

// Estados de pedido
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

    const conteo = (estados || []).map((e) => ({
      estado: e.descripcion,
      cantidad: (pedidos || []).filter(
        (p) => p.idestadopedido === e.idestadopedido
      ).length,
    }));

    res.json(conteo);
  } catch (err) {
    console.error("Error al obtener estados de pedido:", err);
    res.status(500).json({ error: "Error al obtener estados de pedido" });
  }
});

/* =========================================================
   PEDIDOS - ADMIN
========================================================= */

// Listar todos los pedidos
router.get("/admin/pedidos", async (req, res) => {
  try {
    const { data: pedidosRaw, error: pedidosError } = await supabase
      .from("pedido")
      .select(
        "idpedido, total, fechaelaboracionpedido, idestadopedido, cedula, iddireccion"
      )
      .order("fechaelaboracionpedido", { ascending: false });

    if (pedidosError) throw pedidosError;

    if (!pedidosRaw || pedidosRaw.length === 0) {
      return res.status(200).json([]);
    }

    const cedulas = [
      ...new Set(pedidosRaw.map((p) => p.cedula).filter(Boolean)),
    ];

    let mapaUsuarios = {};
    if (cedulas.length > 0) {
      const { data: usuarios, error: usuariosError } = await supabase
        .from("usuario")
        .select("cedula, nombre, apellido, email")
        .in("cedula", cedulas);

      if (usuariosError) throw usuariosError;

      mapaUsuarios = (usuarios || []).reduce((acc, u) => {
        acc[u.cedula] = u;
        return acc;
      }, {});
    }

    const pedidos = pedidosRaw.map((p) => {
      const user = mapaUsuarios[p.cedula] || {};
      const nombreCompleto = `${user.nombre || ""} ${
        user.apellido || ""
      }`.trim();

      return {
        idpedido: p.idpedido,
        numero: `#${p.idpedido}`,
        cliente: nombreCompleto || "Sin nombre",
        direccion: p.iddireccion || "Sin dirección registrada",
        estado: traducirEstado(p.idestadopedido),
        total: Number(p.total || 0),
        fecha: p.fechaelaboracionpedido || "",
      };
    });

    res.status(200).json(pedidos);
  } catch (err) {
    console.error("❌ Error al obtener pedidos admin:", err);
    res.status(500).json({ message: "Error al obtener pedidos" });
  }
});

// Detalle de pedido por ID
router.get("/admin/pedidos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data: pedidoRaw, error: pedidoError } = await supabase
      .from("pedido")
      .select(
        "idpedido, total, fechaelaboracionpedido, idestadopedido, cedula, iddireccion"
      )
      .eq("idpedido", id)
      .single();

    if (pedidoError) {
      if (pedidoError.code === "PGRST116") {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }
      throw pedidoError;
    }

    let usuario = null;
    if (pedidoRaw.cedula) {
      const { data: userData, error: userError } = await supabase
        .from("usuario")
        .select(
          "cedula, nombre, apellido, email, direccion, ciudad, telefono"
        )
        .eq("cedula", pedidoRaw.cedula)
        .single();

      if (userError && userError.code !== "PGRST116") {
        throw userError;
      }

      usuario = userData || null;
    }

    const nombreCompleto = usuario
      ? `${usuario.nombre || ""} ${usuario.apellido || ""}`.trim()
      : "Sin nombre";

    const pedido = {
      idpedido: pedidoRaw.idpedido,
      numero: `#${pedidoRaw.idpedido}`,
      cliente: nombreCompleto,
      correo: usuario?.email || "",
      direccion: usuario?.direccion || pedidoRaw.iddireccion || "",
      ciudad: usuario?.ciudad || "",
      telefono: usuario?.telefono || "",
      estado: traducirEstado(pedidoRaw.idestadopedido),
      total: Number(pedidoRaw.total || 0),
      fecha: pedidoRaw.fechaelaboracionpedido || "",
    };

    res.status(200).json(pedido);
  } catch (err) {
    console.error("❌ Error al obtener pedido:", err);
    res.status(500).json({ message: "Error al obtener pedido" });
  }
});

// Actualizar estado de pedido
router.patch("/admin/pedidos/:id/estado", async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (estado === undefined || estado === null) {
      return res.status(400).json({ message: "El estado es obligatorio" });
    }

    let nuevoIdEstado;
    if (typeof estado === "number") {
      nuevoIdEstado = estado;
    } else {
      nuevoIdEstado = estadoTextoAId(estado);
    }

    if (!nuevoIdEstado) {
      return res.status(400).json({ message: "Estado no válido" });
    }

    const { data, error } = await supabase
      .from("pedido")
      .update({ idestadopedido: nuevoIdEstado })
      .eq("idpedido", id)
      .select("idpedido, idestadopedido")
      .single();

    if (error) {
      console.error("❌ Supabase error al actualizar pedido:", error);
      throw error;
    }

    res.status(200).json({
      message: "Estado actualizado correctamente",
      pedido: {
        idpedido: data.idpedido,
        idestadopedido: data.idestadopedido,
        estadoTexto: traducirEstado(data.idestadopedido),
      },
    });
  } catch (err) {
    console.error("❌ Error al actualizar estado de pedido:", err);
    res
      .status(500)
      .json({ message: "Error al actualizar estado de pedido" });
  }
});

export default router;
