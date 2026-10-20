// Stripe calls this after a paid checkout; it marks the one-of-a-kind pieces as sold
// so the gallery shows them as sold and nobody else can buy them.
import Stripe from "stripe";
import { getStore } from "@netlify/blobs";

export default async (req) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const raw = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, req.headers.get("stripe-signature"), process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed" && event.data.object.payment_status === "paid") {
    const ids = (event.data.object.metadata?.ids || "").split(",").filter(Boolean);
    if (ids.length) {
      const store = getStore("inventory");
      const sold = (await store.get("sold", { type: "json" })) || [];
      await store.setJSON("sold", [...new Set([...sold, ...ids])]);
    }
  }
  return new Response("ok");
};

export const config = { path: "/api/stripe-webhook" };
