import express from "express";
import { supabase as supabaseDB } from "../config/supabase.js";

const router = express.Router();


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

export default router;