import express from "express";
import { supabase as supabaseDB } from "../config/supabase.js";
import { verificarToken } from "../controller/authMiddleware.js";
import busboy from "busboy";

const router = express.Router();

/* =========================================================
   PRODUCTOS - ADMIN
========================================================= */

// 🔒 Proteger todas las rutas admin
router.use(verificarToken);
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


export default router;