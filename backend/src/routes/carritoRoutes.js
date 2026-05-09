import express from "express";
import { supabase } from "../config/db.js";
import { verificarToken } from "../controller/authMiddleware.js";
import { calcularPrecioPromocional } from "../helpers/promocionesHelper.js";

const router = express.Router();

async function obtenerPromociones() {
  const { data, error } = await supabase.from("promociones").select("*");
  if (error) throw error;
  return data || [];
}

async function obtenerCarritoCompleto(cedula) {
  const { data: carritoItems, error: errCarrito } = await supabase
    .from("carrito")
    .select("idproducto, cantidad")
    .eq("cedula", cedula);

  if (errCarrito) throw errCarrito;

  if (!carritoItems || carritoItems.length === 0) return [];

  const ids = carritoItems.map((i) => i.idproducto);

  const { data: productos, error: errProductos } = await supabase
    .from("producto")
    .select("idproducto, nombre, precio, descripcion, stock, idcategoria, idmarca")
    .in("idproducto", ids);

  if (errProductos) throw errProductos;

  const { data: imagenes, error: errImagenes } = await supabase
    .from("producto_imagen")
    .select("idproducto, url")
    .in("idproducto", ids);

  if (errImagenes) throw errImagenes;

  const promociones = await obtenerPromociones();

  return carritoItems.map((item) => {
    const prod = productos.find((p) => p.idproducto === item.idproducto);
    if (!prod) {
      return {
        idproducto: item.idproducto,
        cantidad: item.cantidad,
        nombre: "Producto no encontrado",
        precio: 0,
        precio_original: 0,
        precio_final: 0,
        descuento_porcentaje: 0,
        tiene_promocion: false,
        subtotal: 0,
        imagen_url: null,
      };
    }

    const prodPromo = calcularPrecioPromocional(prod, promociones);
    const precioAplicado = Number(prodPromo.precio_final || prodPromo.precio || 0);

    const imgs = (imagenes || []).filter((i) => i.idproducto === item.idproducto);

    return {
      idproducto: item.idproducto,
      cantidad: item.cantidad,
      nombre: prodPromo.nombre,
      precio: precioAplicado,
      precio_original: Number(prodPromo.precio_original || prodPromo.precio || 0),
      precio_final: precioAplicado,
      descuento_porcentaje: Number(prodPromo.descuento_porcentaje || 0),
      tiene_promocion: Boolean(prodPromo.tiene_promocion),
      promocion_nombre: prodPromo.promocion_nombre || null,
      promocion_fecha_fin: prodPromo.promocion_fecha_fin || null,
      stock: prodPromo.stock || 0,
      subtotal: precioAplicado * item.cantidad,
      imagen_url: imgs[0]?.url || null,
      producto_imagen: imgs.map((i) => ({ url: i.url })),
    };
  });
}

router.use("/", verificarToken);

router.get("/", async (req, res) => {
  const cedula = req.usuario.id;

  try {
    const carrito = await obtenerCarritoCompleto(cedula);
    res.status(200).json(carrito);
  } catch (error) {
    console.error("❌ Error al obtener carrito:", error);
    res.status(500).json({ message: "Error al obtener carrito" });
  }
});

router.post("/agregar", async (req, res) => {
  const cedula = req.usuario.id;
  const { idproducto, cantidad } = req.body;

  if (!idproducto || !cantidad) {
    return res.status(400).json({ message: "Faltan datos: idproducto o cantidad" });
  }

  try {
    const { data: producto, error: productoError } = await supabase
      .from("producto")
      .select("stock, nombre")
      .eq("idproducto", idproducto)
      .single();

    if (productoError) throw productoError;

    const { data: existe, error: existeError } = await supabase
      .from("carrito")
      .select("cantidad")
      .eq("cedula", cedula)
      .eq("idproducto", idproducto)
      .maybeSingle();

    if (existeError) throw existeError;

    const nuevaCantidad = existe ? existe.cantidad + Number(cantidad) : Number(cantidad);

    if (nuevaCantidad > producto.stock) {
      return res.status(400).json({
        message: `Stock insuficiente. Solo hay ${producto.stock} unidades disponibles de "${producto.nombre}".`,
      });
    }

    if (existe) {
      const { error: updateError } = await supabase
        .from("carrito")
        .update({ cantidad: nuevaCantidad })
        .eq("cedula", cedula)
        .eq("idproducto", idproducto);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from("carrito")
        .insert([{ cedula, idproducto, cantidad: nuevaCantidad }]);

      if (insertError) throw insertError;
    }

    res.status(200).json({
      message: "Producto agregado correctamente al carrito",
      carrito: await obtenerCarritoCompleto(cedula),
    });
  } catch (error) {
    console.error("❌ Error al agregar producto al carrito:", error.message);
    res.status(500).json({ message: "Error al agregar producto al carrito" });
  }
});

router.put("/actualizar", async (req, res) => {
  const cedula = req.usuario.id;
  const { idproducto, cantidad } = req.body;

  try {
    if (!idproducto || cantidad < 0) {
      return res.status(400).json({
        message: "Datos inválidos. Se requiere idproducto y cantidad válida.",
      });
    }

    const { data: productoData, error: productoError } = await supabase
      .from("producto")
      .select("stock, nombre")
      .eq("idproducto", idproducto)
      .single();

    if (productoError) throw productoError;

    if (cantidad > productoData.stock) {
      return res.status(400).json({
        message: `Stock insuficiente. Solo hay ${productoData.stock} unidades disponibles de "${productoData.nombre}".`,
      });
    }

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

    const { error: errorUpdate } = await supabase
      .from("carrito")
      .update({ cantidad })
      .eq("idproducto", idproducto)
      .eq("cedula", cedula);

    if (errorUpdate) throw errorUpdate;

    const carrito = await obtenerCarritoCompleto(cedula);

    return res.status(200).json({
      message: "Cantidad actualizada correctamente",
      carrito,
      stockRestante: productoData.stock - cantidad,
    });
  } catch (error) {
    console.error("❌ Error al actualizar carrito:", error);
    return res.status(500).json({
      message: "Error interno del servidor al actualizar el carrito",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.delete("/eliminar/:idproducto", async (req, res) => {
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
    console.error("❌ Error al eliminar producto:", error.message);
    res.status(500).json({ message: "Error al eliminar producto del carrito" });
  }
});

router.delete("/vaciar", async (req, res) => {
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

export default router;