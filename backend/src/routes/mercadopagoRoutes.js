import express from "express";
import dotenv from "dotenv";
import { supabase } from "../config/db.js";

import {
  MercadoPagoConfig,
  Preference,
  Payment
} from "mercadopago";

dotenv.config();

const router = express.Router();

// ==============================
// CONFIGURAR MERCADO PAGO
// ==============================


// ==============================
// CREAR PREFERENCIA DE PAGO
// ==============================
router.post("/crear-preferencia", async (req, res) => {
  
  
  try {
    
    console.log("TOKEN ACTUAL:", process.env.MP_ACCESS_TOKEN);

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });
    const {
      productos = [],
      iddireccion = null,
      source = "producto"
    } = req.body;

    if (!productos || productos.length === 0) {
      return res.status(400).json({
        error: "No hay productos en la compra"
      });
    }

    const items = productos.map((p) => ({
      title: p.nombre,
      quantity: Number(p.cantidad),
      unit_price: Number(p.precio),
      currency_id: "COP",
    }));

    const preference = {
      items,
      metadata: {
        productos,
        iddireccion,
        source,
      },
      back_urls: {
        success: "http://localhost:5173/pago/exitoso",
        failure: "http://localhost:5173/pago/error",
        pending: "http://localhost:5173/pago/pendiente",
      },
      //auto_return: "approved","Si voy a redirigir automáticamente, necesito garantizar que la URL de destino existe y es alcanzable"
    };

    console.log("PREFERENCE COMPLETA:", JSON.stringify(preference, null, 2));

    const preferenceClient = new Preference(client);

    const response = await preferenceClient.create({
      body: preference
    });

    res.json({
      url: response.init_point,
    });

  } catch (error) {
    console.error("Error creando preferencia:", error);
    res.status(500).json({
      error: "Error creando preferencia de pago",
    });
  }
});


// ==============================
// CONFIRMAR PEDIDO
// ==============================
router.post("/pedido/confirmar", async (req, res) => {
  try {
    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });
    const { payment_id } = req.body;

    if (!payment_id) {
      return res.status(400).json({
        error: "payment_id requerido",
      });
    }

    const paymentClient = new Payment(client);

    const payment = await paymentClient.get({
      id: payment_id
    });

    if (!payment) {
      return res.status(404).json({
        error: "Pago no encontrado",
      });
    }

    if (payment.status !== "approved") {
      return res.status(400).json({
        error: "Pago no aprobado",
      });
    }

    const metadata = payment.metadata || {};

    const productos = metadata.productos || [];
    const iddireccion = metadata.iddireccion || null;

    const total = payment.transaction_amount;
    const email = payment.payer?.email;

    if (!email) {
      return res.status(400).json({
        error: "No se encontró email del comprador",
      });
    }

    // ==============================
    // BUSCAR USUARIO
    // ==============================
    const { data: usuario, error: usuarioError } = await supabase
      .from("usuario")
      .select("cedula")
      .eq("email", email)
      .single();

    if (usuarioError || !usuario) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    const cedula = usuario.cedula;

    // ==============================
    // CREAR PEDIDO
    // ==============================
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedido")
      .insert([
        {
          fechaelaboracionpedido: new Date(),
          idestadopedido: 2,
          cedula,
          total,
          iddireccion,
        },
      ])
      .select()
      .single();

    if (pedidoError) {
      console.error(pedidoError);
      return res.status(500).json({
        error: "Error creando pedido",
      });
    }

    // ==============================
    // INSERTAR DETALLE PEDIDO
    // ==============================
    const detalles = productos.map((p) => ({
      idproducto: p.id,
      cantidad: p.cantidad,
      idpedido: pedido.idpedido,
      cedula,
      subtotal: Number(p.precio) * Number(p.cantidad),
    }));

    const { error: detalleError } = await supabase
      .from("detallepedidomm")
      .insert(detalles);

    if (detalleError) {
      console.error(detalleError);
      return res.status(500).json({
        error: "Error insertando detalles",
      });
    }

    res.json({
      success: true,
      message: "Pedido registrado correctamente",
      pedido,
    });

  } catch (error) {
    console.error("Error confirmando pedido:", error);
    res.status(500).json({
      error: "Error confirmando pedido",
    });
  }
});


// ==============================
// WEBHOOK MERCADO PAGO (OPCIONAL)
// ==============================
router.post("/webhook", async (req, res) => {
  try {

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });

    const { type, data } = req.body;

    if (type === "payment") {

      const paymentClient = new Payment(client);

      const payment = await paymentClient.get({
        id: data.id
      });

      if (payment.status === "approved") {
        console.log("Pago aprobado desde webhook");
      }
    }

    res.sendStatus(200);

  } catch (error) {
    console.error("Webhook error:", error);
    res.sendStatus(500);
  }
});

export default router;