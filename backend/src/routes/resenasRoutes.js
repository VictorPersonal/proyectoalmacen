import express from "express";
import { supabase } from "../config/db.js";
import { verificarToken } from "../controller/authMiddleware.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// GET /api/reseñas/producto/:idproducto
// Lista pública de reseñas + promedio de calificación
// ─────────────────────────────────────────────────────────────
router.get("/producto/:idproducto", async (req, res) => {
  const idproducto = parseInt(req.params.idproducto, 10);
  
  if (isNaN(idproducto)) {
    return res.status(400).json({ message: "ID de producto inválido" });
  }

  try {
    const { data: resenas, error } = await supabase
      .from("calificacionproducto")
      .select("idcomentario, fecha, calificacion, comentario, cedula")
      .eq("idproducto", idproducto)
      .order("fecha", { ascending: false });

    if (error) throw error;

    if (!resenas || resenas.length === 0) {
      return res.json([]);
    }

    // Sacar nombres de los usuarios que reseñaron
    const cedulas = [...new Set(resenas.map((r) => r.cedula).filter(Boolean))];
    const { data: usuarios } = await supabase
      .from("usuario")
      .select("cedula, nombre, apellido")
      .in("cedula", cedulas);

    const mapaUsuarios = (usuarios || []).reduce((acc, u) => {
      acc[u.cedula] = `${u.nombre} ${u.apellido}`.trim();
      return acc;
    }, {});

    const resultado = resenas.map((r) => ({
      idcomentario: r.idcomentario,
      fecha: r.fecha || new Date().toISOString().split("T")[0],
      fecha_creacion: r.fecha,
      calificacion: r.calificacion || 0,
      comentario: r.comentario || "",
      usuario_nombre: mapaUsuarios[r.cedula] || "Usuario",
      cedula: r.cedula
    }));

    res.json(resultado);
  } catch (err) {
    console.error("Error al obtener reseñas:", err.message);
    res.status(500).json({ message: "Error al obtener las reseñas" });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/reseñas/producto/:idproducto/stats
// Solo estadísticas (promedio, total, distribución)
// ─────────────────────────────────────────────────────────────
router.get("/producto/:idproducto/stats", async (req, res) => {
  const idproducto = parseInt(req.params.idproducto, 10);
  
  if (isNaN(idproducto)) {
    return res.status(400).json({ message: "ID de producto inválido" });
  }

  try {
    const { data: resenas, error } = await supabase
      .from("calificacionproducto")
      .select("calificacion")
      .eq("idproducto", idproducto);

    if (error) throw error;

    if (!resenas || resenas.length === 0) {
      return res.json({ promedio: 0, total: 0, distribucion: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
    }

    const suma = resenas.reduce((s, r) => s + (r.calificacion || 0), 0);
    const promedio = Math.round((suma / resenas.length) * 10) / 10;
    
    const distribucion = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    resenas.forEach(r => {
      if (r.calificacion >= 1 && r.calificacion <= 5) {
        distribucion[r.calificacion]++;
      }
    });

    res.json({ 
      promedio, 
      total: resenas.length, 
      distribucion 
    });
  } catch (err) {
    console.error("Error al obtener estadísticas:", err.message);
    res.status(500).json({ message: "Error al obtener estadísticas" });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/reseñas
// Crear reseña — solo si el usuario compró el producto
// ─────────────────────────────────────────────────────────────
router.post("/", verificarToken, async (req, res) => {
  const cedula = req.usuario?.id;
  const { id_producto, calificacion, comentario } = req.body;
  
  const idproducto = parseInt(id_producto, 10);

  if (isNaN(idproducto)) {
    return res.status(400).json({ message: "ID de producto inválido" });
  }

  if (!calificacion || calificacion < 1 || calificacion > 5) {
    return res.status(400).json({ message: "La calificación debe ser entre 1 y 5" });
  }

  if (comentario && comentario.length > 500) {
    return res.status(400).json({ message: "El comentario no puede superar 500 caracteres" });
  }

  try {
    // Verificar que el usuario haya comprado el producto
    const { data: compro, error: errorCompra } = await supabase
      .from("detallepedidomm")
      .select("iddetalle")
      .eq("cedula", cedula)
      .eq("idproducto", idproducto)
      .limit(1);

    if (errorCompra) throw errorCompra;

    if (!compro || compro.length === 0) {
      return res.status(403).json({
        message: "Solo puedes reseñar productos que hayas comprado",
        codigo: "NO_COMPRO",
      });
    }

    // Verificar que no haya reseñado ya este producto
    const { data: yaReseno, error: errorResena } = await supabase
      .from("calificacionproducto")
      .select("idcomentario")
      .eq("cedula", cedula)
      .eq("idproducto", idproducto)
      .limit(1);

    if (errorResena) throw errorResena;

    if (yaReseno && yaReseno.length > 0) {
      return res.status(409).json({
        message: "Ya dejaste una reseña para este producto",
        codigo: "YA_RESENO",
      });
    }

    // Insertar la reseña
    const { data: nueva, error: errorInsert } = await supabase
      .from("calificacionproducto")
      .insert([{
        fecha: new Date().toISOString().split("T")[0],
        calificacion: Number(calificacion),
        comentario: comentario?.trim() || null,
        idproducto,
        cedula,
      }])
      .select()
      .single();

    if (errorInsert) throw errorInsert;

    // Obtener nombre del usuario
    const { data: usuario } = await supabase
      .from("usuario")
      .select("nombre, apellido")
      .eq("cedula", cedula)
      .single();

    const nombreCompleto = usuario ? `${usuario.nombre} ${usuario.apellido}`.trim() : "Usuario";

    res.status(201).json({
      message: "Reseña publicada correctamente",
      resena: {
        idcomentario: nueva.idcomentario,
        fecha: nueva.fecha,
        fecha_creacion: nueva.fecha,
        calificacion: nueva.calificacion,
        comentario: nueva.comentario || "",
        usuario_nombre: nombreCompleto,
        cedula: cedula
      }
    });
  } catch (err) {
    console.error("Error al crear reseña:", err.message);
    res.status(500).json({ message: "Error al publicar la reseña" });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/reseñas/:idresena
// Borrar reseña propia
// ─────────────────────────────────────────────────────────────
router.delete("/:idresena", verificarToken, async (req, res) => {
  const cedula = req.usuario?.id;
  const idresena = parseInt(req.params.idresena, 10);

  if (isNaN(idresena)) {
    return res.status(400).json({ message: "ID de reseña inválido" });
  }

  try {
    const { data, error } = await supabase
      .from("calificacionproducto")
      .delete()
      .eq("idcomentario", idresena)
      .eq("cedula", cedula)
      .select()
      .maybeSingle();

    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ message: "Reseña no encontrada o no es tuya" });
    }

    res.json({ message: "Reseña eliminada correctamente" });
  } catch (err) {
    console.error("Error al eliminar reseña:", err.message);
    res.status(500).json({ message: "Error al eliminar la reseña" });
  }
});

export default router;