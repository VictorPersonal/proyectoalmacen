import express from "express";
import { supabase } from "../config/db.js";
import {verificarToken} from "../controller/authMiddleware.js" 

const router = express.Router();

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


export default router;