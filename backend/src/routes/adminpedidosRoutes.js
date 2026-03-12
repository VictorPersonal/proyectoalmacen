import express from "express";
import { supabase } from "../config/db.js";
import { verificarToken } from "../controller/authMiddleware.js";

const router = express.Router();

/* =========================================================
   PEDIDOS - ADMIN
========================================================= */


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

//  estado de pedido
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