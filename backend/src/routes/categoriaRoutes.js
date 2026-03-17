import express from "express";
import { supabase } from "../config/db.js";
import { supabase as supabaseDB } from "../config/supabase.js";

const router = express.Router();

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

export default router;