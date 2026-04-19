import express from "express";

const router = express.Router();

/* =========================================================
   HELPERS
========================================================= */
const validarPromocion = (data) => {
  const errores = [];

  if (!data.nombre || !data.nombre.trim()) {
    errores.push("El nombre de la promoción es obligatorio.");
  }

  if (!data.scope || !["producto", "categoria", "global"].includes(data.scope)) {
    errores.push("El scope debe ser producto, categoria o global.");
  }

  const valor = Number(data.valor_descuento);
  if (isNaN(valor) || valor <= 0 || valor > 90) {
    errores.push("El valor del descuento debe estar entre 1 y 90.");
  }

  if (!data.fecha_inicio) {
    errores.push("La fecha de inicio es obligatoria.");
  }

  if (!data.fecha_fin) {
    errores.push("La fecha de fin es obligatoria.");
  }

  if (data.fecha_inicio && data.fecha_fin) {
    const inicio = new Date(data.fecha_inicio);
    const fin = new Date(data.fecha_fin);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      errores.push("Las fechas no tienen un formato válido.");
    } else if (fin <= inicio) {
      errores.push("La fecha de fin debe ser mayor que la fecha de inicio.");
    }
  }

  if (data.scope === "producto" && !data.idproducto) {
    errores.push("Debes seleccionar un producto para una promoción por producto.");
  }

  if (data.scope === "categoria" && !data.idcategoria) {
    errores.push("Debes seleccionar una categoría para una promoción por categoría.");
  }

  return errores;
};

const normalizarPromocion = (body) => {
  return {
    nombre: body.nombre?.trim(),
    descripcion: body.descripcion?.trim() || null,
    tipo_descuento: "porcentaje",
    valor_descuento: Number(body.valor_descuento),
    scope: body.scope,
    idproducto:
      body.scope === "producto" && body.idproducto
        ? Number(body.idproducto)
        : null,
    idcategoria:
      body.scope === "categoria" && body.idcategoria
        ? Number(body.idcategoria)
        : null,
    fecha_inicio: body.fecha_inicio,
    fecha_fin: body.fecha_fin,
    activo_manual:
      body.activo_manual === undefined ? true : Boolean(body.activo_manual),
  };
};

/* =========================================================
   GET - LISTAR PROMOCIONES
========================================================= */
router.get("/promociones", async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("promociones")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al listar promociones:", error);
      return res.status(500).json({ message: "Error al listar promociones." });
    }

    const ahora = new Date();

    const promocionesConEstado = (data || []).map((promo) => {
      const inicio = new Date(promo.fecha_inicio);
      const fin = new Date(promo.fecha_fin);

      const activa_programada =
        promo.activo_manual && ahora >= inicio && ahora <= fin;

      return {
        ...promo,
        activa_programada,
      };
    });

    return res.json(promocionesConEstado);
  } catch (err) {
    console.error("Error inesperado al listar promociones:", err);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

/* =========================================================
   GET - DETALLE DE UNA PROMOCIÓN
========================================================= */
router.get("/promociones/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await req.supabase
      .from("promociones")
      .select("*")
      .eq("idpromocion", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: "Promoción no encontrada." });
    }

    const ahora = new Date();
    const inicio = new Date(data.fecha_inicio);
    const fin = new Date(data.fecha_fin);

    return res.json({
      ...data,
      activa_programada: data.activo_manual && ahora >= inicio && ahora <= fin,
    });
  } catch (err) {
    console.error("Error al obtener promoción:", err);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

/* =========================================================
   POST - CREAR PROMOCIÓN
========================================================= */
router.post("/promociones", async (req, res) => {
  try {
    const payload = normalizarPromocion(req.body);
    const errores = validarPromocion(payload);

    if (errores.length > 0) {
      return res.status(400).json({
        message: "Datos inválidos.",
        errores,
      });
    }

    const { data, error } = await req.supabase
      .from("promociones")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("Error al crear promoción:", error);
      return res.status(500).json({ message: "No se pudo crear la promoción." });
    }

    return res.status(201).json({
      message: "Promoción creada correctamente.",
      promocion: data,
    });
  } catch (err) {
    console.error("Error inesperado al crear promoción:", err);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

/* =========================================================
   PUT - EDITAR PROMOCIÓN
========================================================= */
router.put("/promociones/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const payload = normalizarPromocion(req.body);
    const errores = validarPromocion(payload);

    if (errores.length > 0) {
      return res.status(400).json({
        message: "Datos inválidos.",
        errores,
      });
    }

    const { data, error } = await req.supabase
      .from("promociones")
      .update(payload)
      .eq("idpromocion", id)
      .select()
      .single();

    if (error || !data) {
      console.error("Error al actualizar promoción:", error);
      return res.status(404).json({ message: "No se pudo actualizar la promoción." });
    }

    return res.json({
      message: "Promoción actualizada correctamente.",
      promocion: data,
    });
  } catch (err) {
    console.error("Error inesperado al actualizar promoción:", err);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

/* =========================================================
   PATCH - ACTIVAR / DESACTIVAR MANUALMENTE
========================================================= */
router.patch("/promociones/:id/estado", async (req, res) => {
  try {
    const { id } = req.params;
    const { activo_manual } = req.body;

    if (typeof activo_manual !== "boolean") {
      return res.status(400).json({
        message: "Debes enviar activo_manual como true o false.",
      });
    }

    const { data, error } = await req.supabase
      .from("promociones")
      .update({ activo_manual })
      .eq("idpromocion", id)
      .select()
      .single();

    if (error || !data) {
      console.error("Error al cambiar estado de promoción:", error);
      return res.status(404).json({ message: "Promoción no encontrada." });
    }

    return res.json({
      message: `Promoción ${activo_manual ? "activada" : "desactivada"} correctamente.`,
      promocion: data,
    });
  } catch (err) {
    console.error("Error inesperado al cambiar estado:", err);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

/* =========================================================
   DELETE - ELIMINAR PROMOCIÓN
========================================================= */
router.delete("/promociones/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await req.supabase
      .from("promociones")
      .delete()
      .eq("idpromocion", id)
      .select()
      .single();

    if (error || !data) {
      console.error("Error al eliminar promoción:", error);
      return res.status(404).json({ message: "Promoción no encontrada." });
    }

    return res.json({
      message: "Promoción eliminada correctamente.",
      promocion: data,
    });
  } catch (err) {
    console.error("Error inesperado al eliminar promoción:", err);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

export default router;