// Returns the ids of pieces sold through the website, so the gallery can mark them.
import { getStore } from "@netlify/blobs";

export default async () => {
  let sold = [];
  try { sold = (await getStore("inventory").get("sold", { type: "json" })) || []; } catch {}
  return new Response(JSON.stringify(sold), {
    headers: { "content-type": "application/json", "cache-control": "public, max-age=30" },
  });
};

export const config = { path: "/api/sold" };
