import express from "express";
import { supabase } from "../config/db.js";
import { verificarToken } from "../controller/authMiddleware.js";

const router = express.Router();

// Helper: estado del ticket
const estadoTicket = (t) => (t.fecharesolucion ? "Cerrado" : "Abierto");

// ─────────────────────────────────────────────────────────────
// POST /api/soporte - Crear ticket
// ─────────────────────────────────────────────────────────────
router.post("/", verificarToken, async (req, res) => {
  const cedula = req.usuario?.id;
  const { asunto, descripcion, idproducto } = req.body;

  if (!asunto || !asunto.trim()) {
    return res.status(400).json({ message: "El asunto es obligatorio" });
  }
  if (!descripcion || !descripcion.trim()) {
    return res.status(400).json({ message: "La descripción es obligatoria" });
  }

  try {
    const { data: ticket, error: ticketError } = await supabase
      .from("soportedereclamos")
      .insert([{
        asunto: asunto.trim(),
        descripcion: descripcion.trim(),
        fechareclamo: new Date().toISOString().split("T")[0],
        cedula,
        idproducto: idproducto ? Number(idproducto) : null,
        leido_admin: false,
        leido_cliente: true,
      }])
      .select()
      .single();

    if (ticketError) throw ticketError;

    const { error: msgError } = await supabase
      .from("mensajes_soporte")
      .insert([{
        idreclamo: ticket.idreclamo,
        cedula,
        mensaje: descripcion.trim(),
        es_admin: false,
      }]);

    if (msgError) throw msgError;

    res.status(201).json({
      message: "Ticket creado correctamente",
      ticket: {
        idreclamo: ticket.idreclamo,
        asunto: ticket.asunto,
        estado: estadoTicket(ticket),
        fecha: ticket.fechareclamo,
      },
    });
  } catch (err) {
    console.error("Error al crear ticket:", err.message);
    res.status(500).json({ message: "Error al crear el ticket" });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/soporte/mis-tickets - Tickets del cliente
// ─────────────────────────────────────────────────────────────
router.get("/mis-tickets", verificarToken, async (req, res) => {
  const cedula = req.usuario?.id;

  try {
    const { data: tickets, error } = await supabase
      .from("soportedereclamos")
      .select("idreclamo, asunto, fechareclamo, fecharesolucion, leido_cliente")
      .eq("cedula", cedula)
      .order("fechareclamo", { ascending: false });

    if (error) throw error;

    const ids = (tickets || []).map((t) => t.idreclamo);
    let conteoMensajes = {};

    if (ids.length > 0) {
      const { data: conteos } = await supabase
        .from("mensajes_soporte")
        .select("idreclamo")
        .in("idreclamo", ids);

      conteoMensajes = (conteos || []).reduce((acc, m) => {
        acc[m.idreclamo] = (acc[m.idreclamo] || 0) + 1;
        return acc;
      }, {});
    }

    const respuesta = (tickets || []).map((t) => ({
      idreclamo: t.idreclamo,
      asunto: t.asunto,
      estado: estadoTicket(t),
      fecha: t.fechareclamo || "",
      totalMensajes: conteoMensajes[t.idreclamo] || 0,
      tieneNuevos: !t.leido_cliente,
    }));

    res.json(respuesta);
  } catch (err) {
    console.error("Error al listar tickets:", err.message);
    res.status(500).json({ message: "Error al obtener tickets" });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/soporte/admin/todos - Admin ve todos
// ─────────────────────────────────────────────────────────────
router.get("/admin/todos", verificarToken, async (req, res) => {
  if (req.usuario?.rol !== "administrador") {
    return res.status(403).json({ message: "Solo administradores" });
  }

  try {
    const { data: tickets, error } = await supabase
      .from("soportedereclamos")
      .select("idreclamo, asunto, fechareclamo, fecharesolucion, cedula, leido_admin")
      .order("fechareclamo", { ascending: false });

    if (error) throw error;

    const cedulas = [...new Set((tickets || []).map((t) => t.cedula).filter(Boolean))];
    let mapaUsuarios = {};
    if (cedulas.length > 0) {
      const { data: usuarios } = await supabase
        .from("usuario")
        .select("cedula, nombre, apellido")
        .in("cedula", cedulas);
      mapaUsuarios = (usuarios || []).reduce((acc, u) => {
        acc[u.cedula] = `${u.nombre} ${u.apellido}`.trim();
        return acc;
      }, {});
    }

    const ids = (tickets || []).map((t) => t.idreclamo);
    let conteoMensajes = {};
    if (ids.length > 0) {
      const { data: conteos } = await supabase
        .from("mensajes_soporte")
        .select("idreclamo")
        .in("idreclamo", ids);

      conteoMensajes = (conteos || []).reduce((acc, m) => {
        acc[m.idreclamo] = (acc[m.idreclamo] || 0) + 1;
        return acc;
      }, {});
    }

    const respuesta = (tickets || []).map((t) => ({
      idreclamo: t.idreclamo,
      asunto: t.asunto,
      estado: estadoTicket(t),
      fecha: t.fechareclamo || "",
      cliente: mapaUsuarios[t.cedula] || "Cliente",
      cedula: t.cedula,
      totalMensajes: conteoMensajes[t.idreclamo] || 0,
      tieneNuevos: !t.leido_admin,
    }));

    res.json(respuesta);
  } catch (err) {
    console.error("Error al listar tickets:", err.message);
    res.status(500).json({ message: "Error al obtener tickets" });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/soporte/:id - Ver hilo completo
// ─────────────────────────────────────────────────────────────
router.get("/:id", verificarToken, async (req, res) => {
  const cedula = req.usuario?.id;
  const esAdmin = req.usuario?.rol === "administrador";
  const idreclamo = parseInt(req.params.id, 10);

  if (isNaN(idreclamo)) {
    return res.status(400).json({ message: "ID de ticket inválido" });
  }

  try {
    let query = supabase
      .from("soportedereclamos")
      .select("idreclamo, asunto, fechareclamo, fecharesolucion, cedula")
      .eq("idreclamo", idreclamo);

    if (!esAdmin) query = query.eq("cedula", cedula);

    const { data: ticket, error: ticketError } = await query.maybeSingle();

    if (ticketError) throw ticketError;
    if (!ticket) {
      return res.status(404).json({ message: "Ticket no encontrado" });
    }

    // Marcar como leído
    if (esAdmin) {
      await supabase.from("soportedereclamos").update({ leido_admin: true }).eq("idreclamo", idreclamo);
    } else {
      await supabase.from("soportedereclamos").update({ leido_cliente: true }).eq("idreclamo", idreclamo);
    }

    const { data: mensajes, error: msgError } = await supabase
      .from("mensajes_soporte")
      .select("idmensaje, cedula, mensaje, es_admin, editado, fechaenvio")
      .eq("idreclamo", idreclamo)
      .order("fechaenvio", { ascending: true });

    if (msgError) throw msgError;

    let nombreCliente = "Cliente";
    if (esAdmin && ticket.cedula) {
      const { data: usr } = await supabase
        .from("usuario")
        .select("nombre, apellido")
        .eq("cedula", ticket.cedula)
        .maybeSingle();
      if (usr) nombreCliente = `${usr.nombre} ${usr.apellido}`.trim();
    }

    res.json({
      idreclamo: ticket.idreclamo,
      asunto: ticket.asunto,
      estado: estadoTicket(ticket),
      fecha: ticket.fechareclamo || "",
      cerrado: !!ticket.fecharesolucion,
      cliente: nombreCliente,
      mensajes: (mensajes || []).map((m) => ({
        idmensaje: m.idmensaje,
        cedula: m.cedula,
        mensaje: m.mensaje,
        esAdmin: m.es_admin,
        esMio: m.cedula === cedula,
        editado: m.editado,
        fechaenvio: m.fechaenvio,
      })),
    });
  } catch (err) {
    console.error("Error al obtener ticket:", err.message);
    res.status(500).json({ message: "Error al obtener el ticket" });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/soporte/:id/mensajes - Enviar mensaje
// ─────────────────────────────────────────────────────────────
router.post("/:id/mensajes", verificarToken, async (req, res) => {
  const cedula = req.usuario?.id;
  const esAdmin = req.usuario?.rol === "administrador";
  const idreclamo = parseInt(req.params.id, 10);
  const { mensaje } = req.body;

  if (isNaN(idreclamo)) {
    return res.status(400).json({ message: "ID de ticket inválido" });
  }
  if (!mensaje || !mensaje.trim()) {
    return res.status(400).json({ message: "El mensaje no puede estar vacío" });
  }

  try {
    let query = supabase
      .from("soportedereclamos")
      .select("idreclamo, cedula, fecharesolucion")
      .eq("idreclamo", idreclamo);

    if (!esAdmin) query = query.eq("cedula", cedula);

    const { data: ticket } = await query.maybeSingle();

    if (!ticket) {
      return res.status(404).json({ message: "Ticket no encontrado" });
    }
    if (ticket.fecharesolucion) {
      return res.status(400).json({ message: "Este ticket está cerrado" });
    }

    const { data: nuevo, error } = await supabase
      .from("mensajes_soporte")
      .insert([{
        idreclamo,
        cedula,
        mensaje: mensaje.trim(),
        es_admin: esAdmin,
      }])
      .select()
      .single();

    if (error) throw error;

    const updateLeido = esAdmin
      ? { leido_cliente: false }
      : { leido_admin: false };

    await supabase
      .from("soportedereclamos")
      .update(updateLeido)
      .eq("idreclamo", idreclamo);

    res.status(201).json({
      message: "Mensaje enviado",
      mensaje: {
        idmensaje: nuevo.idmensaje,
        cedula,
        mensaje: nuevo.mensaje,
        esAdmin,
        esMio: true,
        editado: false,
        fechaenvio: nuevo.fechaenvio,
      },
    });
  } catch (err) {
    console.error("Error al enviar mensaje:", err.message);
    res.status(500).json({ message: "Error al enviar el mensaje" });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/soporte/:id/mensajes/:mid - Editar mensaje
// ─────────────────────────────────────────────────────────────
router.put("/:id/mensajes/:mid", verificarToken, async (req, res) => {
  const cedula = req.usuario?.id;
  const idmensaje = parseInt(req.params.mid, 10);
  const { mensaje } = req.body;

  if (!mensaje || !mensaje.trim()) {
    return res.status(400).json({ message: "El mensaje no puede estar vacío" });
  }

  try {
    const { data, error } = await supabase
      .from("mensajes_soporte")
      .update({
        mensaje: mensaje.trim(),
        editado: true,
        fechaedicion: new Date().toISOString(),
      })
      .eq("idmensaje", idmensaje)
      .eq("cedula", cedula)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: "Mensaje no encontrado o no es tuyo" });
    }

    res.json({ message: "Mensaje editado", mensaje: data });
  } catch (err) {
    console.error("Error al editar mensaje:", err.message);
    res.status(500).json({ message: "Error al editar el mensaje" });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/soporte/:id/mensajes/:mid - Eliminar mensaje
// ─────────────────────────────────────────────────────────────
router.delete("/:id/mensajes/:mid", verificarToken, async (req, res) => {
  const cedula = req.usuario?.id;
  const idmensaje = parseInt(req.params.mid, 10);

  try {
    const { data, error } = await supabase
      .from("mensajes_soporte")
      .delete()
      .eq("idmensaje", idmensaje)
      .eq("cedula", cedula)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: "Mensaje no encontrado o no es tuyo" });
    }

    res.json({ message: "Mensaje eliminado" });
  } catch (err) {
    console.error("Error al eliminar mensaje:", err.message);
    res.status(500).json({ message: "Error al eliminar el mensaje" });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/soporte/:id/cerrar - Cerrar ticket (admin)
// ─────────────────────────────────────────────────────────────
router.patch("/:id/cerrar", verificarToken, async (req, res) => {
  if (req.usuario?.rol !== "administrador") {
    return res.status(403).json({ message: "Solo administradores" });
  }

  const idreclamo = parseInt(req.params.id, 10);

  try {
    const { data, error } = await supabase
      .from("soportedereclamos")
      .update({ fecharesolucion: new Date().toISOString().split("T")[0] })
      .eq("idreclamo", idreclamo)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: "Ticket no encontrado" });
    }

    res.json({ message: "Ticket cerrado correctamente" });
  } catch (err) {
    console.error("Error al cerrar ticket:", err.message);
    res.status(500).json({ message: "Error al cerrar el ticket" });
  }
});

export default router;