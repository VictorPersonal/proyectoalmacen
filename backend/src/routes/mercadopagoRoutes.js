import express from "express";
import dotenv from "dotenv";
import { supabase } from "../config/db.js";

import {
  MercadoPagoConfig,
  Preference,
  Payment,
} from "mercadopago";

import { calcularPrecioPromocional } from "../helpers/promocionesHelper.js";

dotenv.config();

const router = express.Router();

/* =========================================================
   HELPER: RECALCULAR PRODUCTOS CON PROMOCIONES
========================================================= */
const recalcularProductosParaPago = async (productos = []) => {
  const ids = productos
    .map((p) => p.idproducto || p.id)
    .filter(Boolean);

  if (ids.length === 0) {
    throw new Error("No hay productos válidos para recalcular");
  }

  const { data: productosDB, error: productosError } = await supabase
    .from("producto")
    .select("idproducto, nombre, precio, stock, idcategoria, idmarca")
    .in("idproducto", ids);

  if (productosError) throw productosError;

  const { data: promociones, error: promosError } = await supabase
    .from("promociones")
    .select("*");

  if (promosError) throw promosError;

  return productos.map((p) => {
    const id = p.idproducto || p.id;

    const productoDB = productosDB.find(
      (prod) => String(prod.idproducto) === String(id)
    );

    if (!productoDB) {
      throw new Error(`Producto ${id} no encontrado`);
    }

    const cantidad = Number(p.cantidad || 1);

    if (cantidad <= 0) {
      throw new Error(`Cantidad inválida para ${productoDB.nombre}`);
    }

    if (cantidad > productoDB.stock) {
      throw new Error(`Stock insuficiente para ${productoDB.nombre}`);
    }

    const productoConPromo = calcularPrecioPromocional(
      productoDB,
      promociones || []
    );

    const precioAplicado = Number(
      productoConPromo.precio_final || productoConPromo.precio || 0
    );

    return {
      idproducto: productoDB.idproducto,
      id: productoDB.idproducto,
      nombre: productoDB.nombre,
      cantidad,
      precio: precioAplicado,
      precio_original: Number(
        productoConPromo.precio_original || productoDB.precio || 0
      ),
      precio_final: precioAplicado,
      descuento_porcentaje: Number(
        productoConPromo.descuento_porcentaje || 0
      ),
      tiene_promocion: Boolean(productoConPromo.tiene_promocion),
      promocion_nombre: productoConPromo.promocion_nombre || null,
      subtotal: precioAplicado * cantidad,
    };
  });
};

/* =========================================================
   CREAR PREFERENCIA DE PAGO
========================================================= */
router.post("/crear-preferencia", async (req, res) => {
  try {
    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });

    const {
      productos = [],
      iddireccion = null,
      source = "producto",
    } = req.body;

    if (!productos || productos.length === 0) {
      return res.status(400).json({
        error: "No hay productos en la compra",
      });
    }

    const productosRecalculados = await recalcularProductosParaPago(productos);

    const items = productosRecalculados.map((p) => ({
      title: p.nombre,
      quantity: Number(p.cantidad),
      unit_price: Number(p.precio_final),
      currency_id: "COP",
    }));

    const totalRecalculado = productosRecalculados.reduce(
      (acc, p) => acc + Number(p.subtotal || 0),
      0
    );

    const preference = {
      items,
      metadata: {
        productos: productosRecalculados,
        iddireccion,
        source,
        total_productos: totalRecalculado,
      },
      back_urls: {
        success: "http://localhost:5173/pago/exitoso",
        failure: "http://localhost:5173/pago/error",
        pending: "http://localhost:5173/pago/pendiente",
      },
    };

    console.log("PREFERENCE COMPLETA:", JSON.stringify(preference, null, 2));

    const preferenceClient = new Preference(client);

    const response = await preferenceClient.create({
      body: preference,
    });

    res.json({
      url: response.init_point,
      productos: productosRecalculados,
      total: totalRecalculado,
    });
  } catch (error) {
    console.error("Error creando preferencia:", error);

    res.status(500).json({
      error: "Error creando preferencia de pago",
      detalle: error.message,
    });
  }
});

/* =========================================================
   CONFIRMAR PEDIDO
========================================================= */
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
      id: payment_id,
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

    const detalles = productos.map((p) => ({
      idproducto: p.idproducto || p.id,
      cantidad: Number(p.cantidad),
      idpedido: pedido.idpedido,
      cedula,
      subtotal:
        Number(p.precio_final || p.precio || 0) * Number(p.cantidad || 1),
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
      detalles,
    });
  } catch (error) {
    console.error("Error confirmando pedido:", error);

    res.status(500).json({
      error: "Error confirmando pedido",
      detalle: error.message,
    });
  }
});

/* =========================================================
   WEBHOOK MERCADO PAGO
========================================================= */
router.post("/webhook", async (req, res) => {
  try {
    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });

    const { type, data } = req.body;

    if (type === "payment") {
      const paymentClient = new Payment(client);

      const payment = await paymentClient.get({
        id: data.id,
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