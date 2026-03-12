import express from "express";
import { supabase } from "../config/db.js";
import { verificarToken } from "../controller/authMiddleware.js";

const router = express.Router();

/* =========================================================
   ESTADÍSTICAS
========================================================= */

// Productos más vendidos
router.get("/productos-mas-vendidos", verificarToken, async (req, res) => {
  try {
    const tableNames = ["detallepedidomm", "detallepedidoMM", "detallepedido"];

    for (const tableName of tableNames) {
      const { data, error } = await supabase
        .from(tableName)
        .select(`
          cantidad,
          idproducto,
          producto:producto(idproducto, nombre)
        `);

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
    res.status(500).json({
      error: "Error al obtener productos más vendidos",
    });
  }
});

// Ventas mensuales
router.get("/ventas-mensuales", verificarToken, async (req, res) => {
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
        ventasPorMes[mes] =
          (ventasPorMes[mes] || 0) + Number(detalle.subtotal);
      }
    });

    const resultado = Object.entries(ventasPorMes).map(([mes, total]) => ({
      mes,
      total,
    }));

    res.json(resultado);
  } catch (err) {
    console.error("❌ Error al obtener ventas mensuales:", err);
    res.status(500).json({
      error: "Error al obtener ventas mensuales",
    });
  }
});

// Usuarios por tipo
router.get("/usuarios", verificarToken, async (req, res) => {
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
    res.status(500).json({
      error: "Error al obtener usuarios",
    });
  }
});

// Estados de pedido
router.get("/estados-pedidos", verificarToken, async (req, res) => {
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
    res.status(500).json({
      error: "Error al obtener estados de pedido",
    });
  }
});

export default router;