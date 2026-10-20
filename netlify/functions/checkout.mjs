// Creates a Stripe Checkout session for the pieces in the bag.
// Prices, shipping and sold status come from data/art.json + the sold list, never from the browser.
import Stripe from "stripe";
import { getStore } from "@netlify/blobs";
import catalog from "../../data/art.json";

const BUNDLE_COUPON_ID = "BUNDLE15"; // 15% off when buying 2+ pieces (from the sheet)
const SHIP_COUNTRIES = ["US"];

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

async function bundleCoupon(stripe) {
  try {
    return (await stripe.coupons.retrieve(BUNDLE_COUPON_ID)).id;
  } catch {
    return (await stripe.coupons.create({ id: BUNDLE_COUPON_ID, percent_off: 15, duration: "once", name: "Bundle 2+ pieces · 15% off" })).id;
  }
}

export default async (req) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });
  if (!process.env.STRIPE_SECRET_KEY) return json(500, { error: "Checkout isn't set up yet (missing Stripe key)." });

  let body;
  try { body = await req.json(); } catch { return json(400, { error: "Bad request" }); }
  const wanted = Array.isArray(body?.items) ? body.items.slice(0, 50) : [];
  if (!wanted.length) return json(400, { error: "Your bag is empty." });

  let soldNow = [];
  try { soldNow = (await getStore("inventory").get("sold", { type: "json" })) || []; } catch {}

  const byId = new Map(catalog.map((p) => [p.id, p]));
  const lines = [];
  for (const { id, qty } of wanted) {
    const p = byId.get(String(id));
    if (!p) return json(400, { error: "One of the pieces in your bag no longer exists." });
    if (p.sold || soldNow.includes(p.id)) return json(409, { error: `Sorry, “${p.title}” just sold!`, sold: p.id });
    const q = p.multi ? Math.max(1, Math.min(20, parseInt(qty, 10) || 1)) : 1;
    lines.push({ p, q });
  }

  const origin = process.env.URL || new URL(req.url).origin;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  // Combined bundle shipping: one shipment, charged at the highest single-piece rate.
  const shipping = Math.max(0, ...lines.map(({ p }) => p.shipping));
  const pieceCount = lines.reduce((n, l) => n + l.q, 0);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lines.map(({ p, q }) => ({
      quantity: q,
      price_data: {
        currency: "usd",
        unit_amount: p.price,
        product_data: {
          name: p.title,
          description: [p.medium, p.size].filter(Boolean).join(" · ") || undefined,
          images: [/^https?:/.test(p.image) ? p.image : `${origin}/${p.image}`],
          metadata: { id: p.id, ...(p.fulfill ? { fulfill: p.fulfill } : {}) },
        },
      },
    })),
    discounts: pieceCount >= 2 ? [{ coupon: await bundleCoupon(stripe) }] : undefined,
    shipping_address_collection: { allowed_countries: SHIP_COUNTRIES },
    shipping_options: [{
      shipping_rate_data: {
        type: "fixed_amount",
        display_name: shipping ? "Shipping (combined for your whole order)" : "Free shipping",
        fixed_amount: { amount: shipping, currency: "usd" },
      },
    }],
    phone_number_collection: { enabled: true },
    metadata: { ids: lines.filter(({ p }) => !p.multi).map(({ p }) => p.id).join(",").slice(0, 500) },
    success_url: `${origin}/thanks.html?session={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/gallery.html`,
  });

  return json(200, { url: session.url });
};

export const config = { path: "/api/checkout" };
