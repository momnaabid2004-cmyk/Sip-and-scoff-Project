/**
 * Seed script — `npm run db:seed`   (add `-- --demo` for sample orders, a message, an enquiry and a chat).
 * Safe to run more than once: it only creates what is missing and never overwrites admin edits.
 */
import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as t from "../lib/db/schema";
import { SEED_CATEGORIES, SEED_FEATURES, SEED_OWNER, SEED_PRODUCTS, SEED_SETTINGS } from "../lib/db/seed";
import { hashPassword } from "../lib/auth/password";

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) throw new Error("Set DATABASE_URL / DIRECT_URL in .env first.");
const client = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
const db = drizzle(client);
const demo = process.argv.includes("--demo");

async function main() {
  // settings (only if missing)
  await db.insert(t.settings).values({ id: 1, data: SEED_SETTINGS }).onConflictDoNothing();

  // categories & features by fixed id — created only if missing
  await db.insert(t.categories).values(SEED_CATEGORIES).onConflictDoNothing();
  await db.insert(t.features).values(SEED_FEATURES).onConflictDoNothing();

  // products — only when the menu is empty, so items an admin deleted don't come back
  const productCount = await db.$count(t.products);
  if (productCount === 0) {
    await db.insert(t.products).values(SEED_PRODUCTS.map(({ createdAt: _c, updatedAt: _u, ...p }) => p));
    console.log(`✓ ${SEED_PRODUCTS.length} products`);
  } else console.log(`• menu already has ${productCount} products — left as is`);

  // first owner
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before seeding.");
  if (password.length < 8) throw new Error("ADMIN_PASSWORD must be at least 8 characters.");
  const [existing] = await db.select({ id: t.adminUsers.id }).from(t.adminUsers).where(eq(t.adminUsers.email, email));
  if (!existing) {
    await db.insert(t.adminUsers).values({ id: SEED_OWNER.id, name: SEED_OWNER.name, role: SEED_OWNER.role, email, passwordHash: await hashPassword(password) });
    console.log(`✓ owner account ${email}`);
    if (password === "ChangeMe123!") console.warn("⚠  The owner password is the default 'ChangeMe123!'. Change it in Admin → Team right after your first login.");
  } else console.log(`• owner ${email} already exists — password not changed`);

  if (demo) await seedDemo();
  console.log("✓ Seed complete.");
}

/** Realistic sample activity so the dashboard, orders board, inbox and AI pages aren't empty. */
async function seedDemo() {
  if ((await db.$count(t.orders)) > 0) return console.log("• orders already exist — demo data skipped");
  const product = (id: string) => {
    const p = SEED_PRODUCTS.find((x) => x.id === id);
    if (!p) throw new Error(`Demo product ${id} is missing from lib/db/seed.ts`);
    return p;
  };
  const ago = (min: number) => new Date(Date.now() - min * 60_000);
  const demoOrders = [
    { name: "Ayesha Khan", phone: "03001234567", area: "Gulberg", address: "House 12, Block C2", type: "delivery", status: "new" as const, at: 6, items: [["coffee-spanish-latte", 2], ["desserts-molten-lava-cake", 1]] as const },
    { name: "Bilal Ahmed", phone: "03214567890", area: "DHA", address: "45-Y, Phase 3", type: "delivery", status: "preparing" as const, at: 22, items: [["chai-kashmiri-chai", 2], ["snacks-samosa-platter", 1]] as const },
    { name: "Sana Malik", phone: "03331112233", area: "", address: "", type: "pickup", status: "completed" as const, at: 180, items: [["ice-cream-brownie-sundae", 1], ["shakes-mango-shake", 1]] as const },
  ];
  for (const o of demoOrders) {
    const lines = o.items.map(([id, qty]) => {
      const p = product(id);
      return { productId: p.id, name: p.name, unitPrice: p.price, qty, options: "" };
    });
    const subtotal = lines.reduce((a, l) => a + l.unitPrice * l.qty, 0);
    const fee = o.type === "pickup" || subtotal >= SEED_SETTINGS.freeDeliveryOver ? 0 : SEED_SETTINGS.deliveryFee;
    const [row] = await db
      .insert(t.orders)
      .values({
        type: o.type, customerName: o.name, customerPhone: o.phone, address: o.address, area: o.area,
        subtotal, deliveryFee: fee, total: subtotal + fee, payment: "cod", status: o.status, createdAt: ago(o.at), updatedAt: ago(o.at),
        preparingAt: o.status !== "new" ? ago(o.at - 5) : null, completedAt: o.status === "completed" ? ago(o.at - 40) : null,
      })
      .returning({ id: t.orders.id });
    await db.insert(t.orderItems).values(lines.map((l) => ({ ...l, orderId: row.id })));
  }
  await db.insert(t.messages).values({ name: "Hamza Raza", email: "hamza@example.com", phone: "0300 7654321", subject: "Office order", message: "Do you offer a discount for 30 coffees every Friday morning for our office in Gulberg?" });
  const [conv] = await db.insert(t.chatConversations).values({ messageCount: 2, inputTokens: 2100, outputTokens: 60, createdAt: ago(30), updatedAt: ago(30) }).returning({ id: t.chatConversations.id });
  await db.insert(t.chatMessages).values([
    { conversationId: conv.id, role: "user", content: "DHA deliver karte ho?", createdAt: ago(30) },
    { conversationId: conv.id, role: "assistant", content: "Ji haan! DHA mein delivery hoti hai — Rs 150 fee, Rs 2,500 se upar free, 30–45 minute mein. 🛵", source: "ai", model: "demo", inputTokens: 2100, outputTokens: 60, createdAt: ago(29) },
  ]);
  await db.insert(t.enquiries).values({ type: "catering", name: "Fatima Noor", phone: "03017778899", date: "Saturday", time: "7 PM", guests: 40, details: "Birthday party — chai, snacks and a 2 kg cake", conversationId: conv.id });
  console.log("✓ demo orders, message, enquiry and chat");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e.message ?? e);
    process.exitCode = 1;
  })
  .finally(() => client.end());
