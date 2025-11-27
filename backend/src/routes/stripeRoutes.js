import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import { supabase } from "../config/db.js";

dotenv.config();

const router = express.Router();

// Instancia de Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ==========================
// Crear sesión de pago - VERSIÓN CORREGIDA
// ==========================
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { 
      productName, 
      price, 
      source = "producto", 
      iddireccion = null,
      productos = [] // 👈 ¡FALTABA ESTO!
    } = req.body;

    console.log("🎯 DATOS RECIBIDOS EN BACKEND:");
    console.log("- Product Name:", productName);
    console.log("- Price:", price);
    console.log("- Source:", source);
    console.log("- Productos recibidos:", productos); // 👈 Ahora sí existe
    console.log("- Cantidad de productos:", productos.length);

    // Validar que hay productos
    if (!productos || productos.length === 0) {
      console.error("❌ ERROR: No hay productos en la solicitud");
      return res.status(400).json({ error: "No hay productos en la compra" });
    }

    // 🔥 CREAR LINE_ITEMS DINÁMICAMENTE DESDE LOS PRODUCTOS
    const line_items = productos.map(producto => ({
      price_data: {
        currency: "cop",
        product_data: { 
          name: producto.nombre,
          description: `ID: ${producto.id}` // 👈 Para referencia
        },
        unit_amount: Math.round(producto.precio * 100), // Convertir a centavos
      },
      quantity: producto.cantidad || 1,
    }));

    console.log("💰 Line items creados:", line_items);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      invoice_creation: { enabled: true },

      success_url: "http://localhost:5173/checkout/forma-entrega/pago/exitoso?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "http://localhost:5173/checkout/forma-entrega/pago",

      billing_address_collection: "required",

      line_items: line_items, // 👈 USAR LOS PRODUCTOS DINÁMICOS

      metadata: {
        source,
        iddireccion: iddireccion ? iddireccion.toString() : null,
        productos: JSON.stringify(productos) // 👈 GUARDAR PRODUCTOS COMO STRING
      },
    });

    console.log("✅ Sesión Stripe creada con ID:", session.id);
    res.json({ url: session.url });
  } catch (error) {
    console.log("❌ Error creando sesión:", error);
    res.status(500).json({ error: "No se pudo crear la sesión" });
  }
});

// ==========================
// Obtener factura (PDF)
// ==========================
router.get("/factura/:sessionId", async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session.invoice) {
      return res.status(404).json({ message: "La factura aún no está disponible." });
    }

    const factura = await stripe.invoices.retrieve(session.invoice);
    res.json({ url: factura.invoice_pdf });
  } catch (error) {
    console.error("Error obteniendo factura:", error);
    res.status(500).json({ message: "Error al obtener la factura" });
  }
});

// ==========================
// Confirmar pedido
// ==========================
// ==========================
// Confirmar pedido - VERSIÓN CORREGIDA
// ==========================
router.post("/pedido/confirmar", async (req, res) => {
  try {
    const { session_id } = req.body;

    console.log("🔔 Confirmando pedido para session:", session_id);

    // Obtener datos reales del pago desde Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["line_items"]
    });

    const total = session.amount_total / 100;
    const email = session.customer_details?.email;
    const source = session.metadata?.source || "producto";
    const iddireccion = session.metadata?.iddireccion || null;
    
    // Obtener productos del metadata
    let productosMetadata = [];
    try {
      productosMetadata = session.metadata?.productos 
        ? JSON.parse(session.metadata.productos) 
        : [];
    } catch (parseError) {
      console.error("❌ Error parseando productos:", parseError);
    }

    console.log("🛒 Productos a insertar:", productosMetadata);

    if (!email) {
      return res.status(400).json({ error: "Email no encontrado en la sesión" });
    }

    // Buscar usuario por email
    const { data: usuario, error: userError } = await supabase
      .from("usuario")
      .select("cedula")
      .eq("email", email)
      .single();

    if (userError || !usuario) {
      console.error("❌ Usuario no encontrado para email:", email);
      return res.status(400).json({ error: "Usuario no encontrado" });
    }

    const cedula = usuario.cedula;

    // Crear pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedido")
      .insert([
        {
          fechaelaboracionpedido: new Date(),
          idestadopedido: 2, // Pagado
          cedula,
          total,
          iddireccion
        }
      ])
      .select()
      .single();

    if (pedidoError) {
      console.error("❌ Error creando pedido:", pedidoError);
      return res.status(400).json({ error: pedidoError.message });
    }

    console.log("✅ Pedido creado:", pedido.idpedido);

    // Insertar detalles del pedido
    if (productosMetadata.length > 0) {
      const detallesInsert = productosMetadata.map(item => ({
        idproducto: item.id,
        cantidad: item.cantidad,
        idpedido: pedido.idpedido,
        cedula: cedula,
        subtotal: (item.precio * item.cantidad)
      }));

      console.log("📝 Insertando detalles:", detallesInsert);

      const { data: detalleData, error: detalleError } = await supabase
        .from("detallepedidomm")
        .insert(detallesInsert)
        .select();

      if (detalleError) {
        console.error("❌ Error insertando detalles:", detalleError);
        return res.status(400).json({ error: detalleError.message });
      }

      console.log("✅ Detalles insertados:", detalleData);
      
      // ✅ EL TRIGGER 'tr_control_stock' SE EJECUTA AUTOMÁTICAMENTE
      // y descuenta el stock cuando se inserta en detallepedidoMM
      console.log("✅ Stock descontado automáticamente por el trigger");
      
    } else {
      console.warn("⚠️ No hay productos para insertar en detallepedidoMM");
    }

    // Vaciar carrito si la compra fue desde carrito
    if (source === "carrito") {
      const { error: carritoError } = await supabase
        .from("carrito")
        .delete()
        .eq("cedula", cedula);

      if (carritoError) {
        console.error("❌ Error vaciando carrito:", carritoError);
      } else {
        console.log("✅ Carrito vaciado para usuario:", cedula);
      }
    }

    console.log("🎉 Pedido confirmado exitosamente");

    res.json({
      message: "Pedido registrado correctamente",
      pedido,
      source,
      productosCount: productosMetadata.length
    });

  } catch (error) {
    console.error("💥 Error general confirmando pedido:", error);
    res.status(500).json({ error: "Error al confirmar pedido: " + error.message });
  }
});

export default router;