import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// ⬅️ AQUÍ se lee la secret del .env automáticamente
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/create-checkout-session", async (req, res) => {
  try {
    const { productName, price } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: "https://dulchehogar.netlify.app/checkout/forma-entrega/pago/exitoso",
      cancel_url: "https://dulchehogar.netlify.app/pago-cancelado",
      billing_address_collection: "required",
      line_items: [
        {
          price_data: {
            currency: "cop",
            product_data: { name: productName },
            unit_amount: price * 100,
          },
          quantity: 1,
        },
      ],
    });

    res.json({ url: session.url });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "No se pudo crear la sesión" });
  }
});

export default router;
