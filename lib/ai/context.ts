import "server-only";
import { db } from "@/lib/db";
import { formatPKR } from "@/lib/pricing";
import type { Category, Feature, Product, Settings } from "@/lib/db/types";

export type CafeContext = { settings: Settings; categories: Category[]; products: Product[]; features: Feature[] };

/** Live data from the database — the assistant always knows today's menu, prices and policies. */
export async function loadContext(): Promise<CafeContext> {
  const [settings, categories, products, features] = await Promise.all([db.settings.get(), db.categories.list(), db.products.list(), db.features.list()]);
  return { settings, categories, products: products.filter((p) => p.available), features: features.filter((f) => f.active) };
}

/** Compact text version used as the system prompt for an LLM. */
export function contextToText({ settings: s, categories, products, features }: CafeContext) {
  const menu = categories
    .map((c) => {
      const items = products.filter((p) => p.categoryId === c.id);
      if (!items.length) return "";
      return `## ${c.name}\n` + items.map((p) => `- ${p.name} — ${formatPKR(p.price)}${p.tags.length ? ` [${p.tags.join(", ")}]` : ""}: ${p.description}${p.options.length ? ` (options: ${p.options.map((g) => `${g.name}: ${g.choices.map((c) => c.label + (c.priceDelta ? ` +${c.priceDelta}` : "")).join("/")}`).join("; ")})` : ""}`).join("\n");
    })
    .filter(Boolean)
    .join("\n\n");
  return `CAFÉ: ${s.cafeName} — ${s.tagline}
ADDRESS: ${s.address}, ${s.city}
PHONE: ${s.phone} · WHATSAPP: ${s.whatsapp} · EMAIL: ${s.email}
HOURS: ${s.hours.map((h) => `${h.days} ${h.time}`).join("; ")} (Pakistan time)
DELIVERY: ${formatPKR(s.deliveryFee)} fee, free over ${formatPKR(s.freeDeliveryOver)}, ${s.deliveryTime}. Areas: ${s.deliveryAreas.join(", ")}. Pickup also available.
PAYMENT: Paid on delivery or at pickup — cash, card (rider carries a machine), JazzCash or Easypaisa. No online payment on the website.
ORDER TRACKING: customers can check status on the "Track order" page (order number + mobile number). Every order is confirmed by a phone call from the café before it is prepared.
FEATURES: ${features.map((f) => `${f.title} (${f.description})`).join("; ")}
EXTRA FACTS & POLICIES FROM THE OWNER:
${s.aiKnowledge || "(none)"}

MENU (prices in PKR):
${menu}`;
}
