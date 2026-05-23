import express from "express";
import { supabase as supabaseDB } from "../config/supabase.js";
import { calcularPrecioPromocional } from "../helpers/promocionesHelper.js";

const router = express.Router();

/* =========================================================
   HELPERS
========================================================= */
const enriquecerProductosConPromociones = (productos = [], promociones = []) => {
  return productos.map((producto) =>
    calcularPrecioPromocional(producto, promociones)
  );
};

/* =========================================================
   PRODUCTOS - PÚBLICO (LISTA + DETALLE)
========================================================= */

// Lista de productos (solo activos, con imágenes, filtros completos)
// Query params: search, precioMin, precioMax, idMarca, idCategoria, ordenar
router.get("/productos", async (req, res) => {
  try {
    const { search, precioMin, precioMax, idMarca, idCategoria, ordenar } = req.query;

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
        categoria_id: idcategoria (
          idcategoria,
          descripcionCategoria
        ),
        producto_imagen (
          idimagen,
          url
        )
      `)
      .eq("activo", true);

    // ── Filtro de texto ──────────────────────────────────────────
    if (search && search.trim()) {
      query = query.or(
        `nombre.ilike.%${search.trim()}%,descripcion.ilike.%${search.trim()}%`
      );
    }

    // ── Filtro por rango de precio ───────────────────────────────
    if (precioMin !== undefined && precioMin !== "") {
      query = query.gte("precio", Number(precioMin));
    }
    if (precioMax !== undefined && precioMax !== "") {
      query = query.lte("precio", Number(precioMax));
    }

    // ── Filtro por marca ─────────────────────────────────────────
    if (idMarca && idMarca !== "todas") {
      query = query.eq("idmarca", Number(idMarca));
    }

    // ── Filtro por categoría ─────────────────────────────────────
    if (idCategoria && idCategoria !== "todas") {
      query = query.eq("idcategoria", Number(idCategoria));
    }

    // ── Ordenamiento ─────────────────────────────────────────────
    switch (ordenar) {
      case "precio_asc":
        query = query.order("precio", { ascending: true });
        break;
      case "precio_desc":
        query = query.order("precio", { ascending: false });
        break;
      case "nombre_asc":
        query = query.order("nombre", { ascending: true });
        break;
      default:
        // "recientes" o sin ordenar
        query = query.order("idproducto", { ascending: false });
    }

    const { data: productos, error } = await query;

    if (error) throw error;

    const { data: promociones, error: promoError } = await supabaseDB
      .from("promociones")
      .select("*");

    if (promoError) throw promoError;

    // Añadir nombre_categoria a cada producto usando el campo correcto
    const productosConCategoria = (productos || []).map(producto => ({
      ...producto,
      nombre_categoria: producto.categoria_id?.descripcionCategoria || `Categoría ${producto.idcategoria}`,
      categoria_id: undefined
    }));

    const productosConPromocion = enriquecerProductosConPromociones(
      productosConCategoria,
      promociones || []
    );

    res.json(productosConPromocion);
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
        categoria_id: idcategoria (
          idcategoria,
          descripcionCategoria
        ),
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

    // Añadir nombre_categoria usando el campo correcto
    const productoConCategoria = {
      ...producto,
      nombre_categoria: producto.categoria_id?.descripcionCategoria || `Categoría ${producto.idcategoria}`,
      categoria_id: undefined
    };

    const { data: promociones, error: promoError } = await supabaseDB
      .from("promociones")
      .select("*");

    if (promoError) throw promoError;

    const productoConPromocion = calcularPrecioPromocional(
      productoConCategoria,
      promociones || []
    );

    res.json(productoConPromocion);
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