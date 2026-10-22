/**
 * End-to-end API checks against a running server.
 *   npm run build && npm start         (in one terminal)
 *   npm run test:api                   (in another; BASE_URL defaults to http://localhost:3000)
 * Uses ADMIN_EMAIL / ADMIN_PASSWORD from .env. Creates a few test rows (orders, messages, a product) and cleans up the product.
 */
import "dotenv/config";

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const ORIGIN = { Origin: BASE };
let pass = 0;
let fail = 0;
const check = (name: string, ok: boolean, extra = "") => {
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? "✓" : "✗"} ${name}${extra ? `  — ${extra}` : ""}`);
};

async function req(path: string, init: RequestInit & { json?: unknown; cookie?: string } = {}) {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  if (init.json !== undefined) headers["Content-Type"] = "application/json";
  if (init.cookie) headers.Cookie = init.cookie;
  const res = await fetch(BASE + path, { ...init, headers, body: init.json !== undefined ? JSON.stringify(init.json) : init.body, redirect: "manual" });
  const text = await res.text();
  let body: any = text;
  try {
    body = JSON.parse(text);
  } catch {}
  return { status: res.status, body, headers: res.headers };
}

async function main() {
  // ── public pages ──
  for (const p of ["/", "/menu", "/menu/coffee", "/about", "/contact", "/checkout", "/track"]) {
    const r = await req(p);
    check(`GET ${p} renders`, r.status === 200);
  }
  const home = await req("/");
  check("security headers present (CSP, X-Frame-Options, nosniff)", !!home.headers.get("content-security-policy") && home.headers.get("x-frame-options") === "DENY" && home.headers.get("x-content-type-options") === "nosniff");
  check("unknown category → 404", (await req("/menu/does-not-exist")).status === 404);

  // ── menu ──
  const menu = await req("/api/menu");
  check("GET /api/menu returns categories + products", menu.status === 200 && menu.body.categories.length > 0 && menu.body.products.length > 0, `${menu.body.products?.length} products`);
  const latte = menu.body.products.find((p: any) => p.options.length > 1);
  const size = latte.options.find((g: any) => !g.multi);

  // ── orders ──
  const goodOrder = { type: "pickup", payment: "cod", customer: { name: "API Test", phone: "0300-1112223", email: "api-test@example.com" }, items: [{ productId: latte.id, qty: 2, choiceIds: [size.choices[1].id] }] };
  const o = await req("/api/orders", { method: "POST", json: goodOrder, headers: ORIGIN });
  const expected = (latte.price + size.choices[1].priceDelta) * 2;
  check("POST /api/orders creates order with server-side price", o.status === 201 && o.body.total === expected && /^SS-\d+$/.test(o.body.code), `${o.body.code} Rs ${o.body.total} (expected ${expected})`);
  const twoSizes = await req("/api/orders", { method: "POST", headers: ORIGIN, json: { ...goodOrder, items: [{ productId: latte.id, qty: 1, choiceIds: size.choices.map((c: any) => c.id) }] } });
  check("order rejects two choices in a single-choice group", twoSizes.status === 422);
  const foreign = await req("/api/orders", { method: "POST", headers: ORIGIN, json: { ...goodOrder, items: [{ productId: latte.id, qty: 1, choiceIds: ["not-a-real-option"] }] } });
  check("order rejects options from another product", foreign.status === 422);
  const badPhone = await req("/api/orders", { method: "POST", headers: ORIGIN, json: { ...goodOrder, customer: { name: "X Y", phone: "12345" } } });
  check("order rejects invalid phone with field error", badPhone.status === 422 && !!badPhone.body.errors?.["customer.phone"]);
  const badArea = await req("/api/orders", { method: "POST", headers: ORIGIN, json: { ...goodOrder, type: "delivery", customer: { name: "X Y", phone: "03001234567", address: "House 1", area: "Mars" } } });
  check("delivery to an unlisted area is rejected", badArea.status === 422);
  const evil = await req("/api/orders", { method: "POST", json: goodOrder, headers: { Origin: "https://evil.example" } });
  check("cross-site POST blocked (CSRF)", evil.status === 403);

  // ── tracking ──
  const tr = await req("/api/orders/track", { method: "POST", headers: ORIGIN, json: { code: o.body.code, phone: "+92 300 1112223" } });
  check("track order with code + phone", tr.status === 200 && tr.body.status === "new" && tr.body.code === o.body.code);
  check("tracking response hides phone & address", tr.status === 200 && !JSON.stringify(tr.body).includes("1112223") && !("address" in tr.body));
  check("tracking response hides email", !JSON.stringify(tr.body).includes("api-test@example.com"));
  const badEmail = await req("/api/orders", { method: "POST", json: { ...goodOrder, customer: { ...goodOrder.customer, email: "not-an-email" } }, headers: ORIGIN });
  check("order rejects an invalid email", badEmail.status === 422 && !!badEmail.body.errors?.["customer.email"]);
  const trWrong = await req("/api/orders/track", { method: "POST", headers: ORIGIN, json: { code: o.body.code, phone: "03009999999" } });
  check("track with wrong phone → 404 (no data leak)", trWrong.status === 404);

  // ── contact + newsletter ──
  const c = await req("/api/contact", { method: "POST", headers: ORIGIN, json: { name: "API Test", email: "api@test.pk", message: "Hello from the automated API test suite." } });
  check("POST /api/contact saves message", c.status === 201);
  const cBad = await req("/api/contact", { method: "POST", headers: ORIGIN, json: { name: "A", email: "nope", message: "short" } });
  check("contact validation errors", cBad.status === 422 && Object.keys(cBad.body.errors ?? {}).length >= 2);
  const email = `nl${Date.now()}@test.pk`;
  const n1 = await req("/api/newsletter", { method: "POST", headers: ORIGIN, json: { email } });
  const n2 = await req("/api/newsletter", { method: "POST", headers: ORIGIN, json: { email } });
  check("newsletter subscribe + duplicate handled", n1.status === 201 && n2.status === 200);
  const unsub = await req("/api/newsletter/unsubscribe?token=bad");
  check("unsubscribe with bad token redirects safely", unsub.status === 303 && (unsub.headers.get("location") ?? "").includes("ok=0"));

  // ── chat (built-in or AI) ──
  const chat = await req("/api/chat", { method: "POST", headers: ORIGIN, json: { message: "DHA deliver karte ho?" } });
  const conv = chat.headers.get("x-conversation-id") ?? chat.body?.conversationId;
  const reply = typeof chat.body === "string" ? chat.body : chat.body.reply;
  check("POST /api/chat answers and returns a conversation id", chat.status === 200 && !!conv && reply.length > 5, reply.slice(0, 80).replace(/\n/g, " "));
  const chat2 = await req("/api/chat", { method: "POST", headers: ORIGIN, json: { message: "Timings?", conversationId: conv } });
  const conv2 = chat2.headers.get("x-conversation-id") ?? chat2.body?.conversationId;
  check("chat continues the same conversation", conv2 === conv);
  check("chat rejects empty message", (await req("/api/chat", { method: "POST", headers: ORIGIN, json: { message: "   " } })).status === 422);
  check("chat rejects >1000 chars", (await req("/api/chat", { method: "POST", headers: ORIGIN, json: { message: "a".repeat(1001) } })).status === 422);

  // ── admin auth ──
  check("admin API without login → 401", (await req("/api/admin/orders")).status === 401);
  check("admin page without login → redirect to login", [307, 308].includes((await req("/admin")).status));
  const badLogin = await req("/api/admin/login", { method: "POST", headers: ORIGIN, json: { email: process.env.ADMIN_EMAIL, password: "wrong-password" } });
  check("wrong password rejected", badLogin.status === 401);
  const login = await req("/api/admin/login", { method: "POST", headers: ORIGIN, json: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD } });
  const setCookie = login.headers.get("set-cookie") ?? "";
  const cookie = setCookie.split(";")[0];
  check("admin login sets HttpOnly SameSite cookie", login.status === 200 && /HttpOnly/i.test(setCookie) && /SameSite=lax/i.test(setCookie));
  check("forged cookie rejected", (await req("/api/admin/me", { cookie: "ss_admin=eyJzdWIiOiJ4In0.AAAA" })).status === 401);
  const noOrigin = await req("/api/admin/products", { method: "POST", cookie, json: {} });
  check("admin write without Origin header blocked", noOrigin.status === 403);

  // ── admin CRUD ──
  const me = await req("/api/admin/me", { cookie });
  check("GET /api/admin/me", me.status === 200 && me.body.admin.email === process.env.ADMIN_EMAIL && !("passwordHash" in me.body.admin));
  const orders = await req("/api/admin/orders", { cookie });
  const mine = orders.body.find?.((x: any) => x.code === o.body.code);
  check("admin lists orders", orders.status === 200 && !!mine);
  check("order saves customer name, phone, email and payment", mine.customer.name === "API Test" && mine.customer.phone === "03001112223" && mine.customer.email === "api-test@example.com" && mine.payment === "cod");
  const cf = await req(`/api/admin/orders/${mine.id}`, { method: "PATCH", cookie, headers: ORIGIN, json: { status: "confirmed" } });
  check("admin confirms order after phone call", cf.status === 200 && cf.body.status === "confirmed" && !!cf.body.timeline.confirmedAt);
  const tr3 = await req("/api/orders/track", { method: "POST", headers: ORIGIN, json: { code: o.body.code, phone: "03001112223" } });
  check("customer tracking shows Confirmed", tr3.body.status === "confirmed" && !!tr3.body.timeline.confirmedAt);
  const st = await req(`/api/admin/orders/${mine.id}`, { method: "PATCH", cookie, headers: ORIGIN, json: { status: "preparing" } });
  check("admin updates order status", st.status === 200 && st.body.status === "preparing" && !!st.body.timeline.preparingAt);
  const tr2 = await req("/api/orders/track", { method: "POST", headers: ORIGIN, json: { code: o.body.code, phone: "03001112223" } });
  check("customer tracking reflects new status", tr2.body.status === "preparing");

  const cats = await req("/api/admin/categories", { cookie });
  const created = await req("/api/admin/products", { method: "POST", cookie, headers: ORIGIN, json: { name: "Test Rose Latte", description: "Automated test item", categoryId: cats.body[0].id, price: 777, art: "cup", tint: "#C7843F", tags: ["new"], options: [], available: true, featured: false, sortOrder: 99 } });
  check("admin creates product", created.status === 201 && created.body.slug === "test-rose-latte");
  const upd = await req(`/api/admin/products/${created.body.id}`, { method: "PUT", cookie, headers: ORIGIN, json: { ...created.body, price: 790, image: null } });
  check("admin updates product", upd.status === 200 && upd.body.price === 790);
  const badImg = await req(`/api/admin/products/${created.body.id}`, { method: "PUT", cookie, headers: ORIGIN, json: { ...created.body, image: "javascript:alert(1)" } });
  check("product image must be https or an upload", badImg.status === 422);
  const menu2 = await req("/api/menu");
  check("new product appears on public menu", menu2.body.products.some((p: any) => p.id === created.body.id));
  const del = await req(`/api/admin/products/${created.body.id}`, { method: "DELETE", cookie, headers: ORIGIN });
  check("admin deletes product", del.status === 200);
  const catDel = await req(`/api/admin/categories/${cats.body[0].id}`, { method: "DELETE", cookie, headers: ORIGIN });
  check("can't delete a category that still has products", catDel.status === 409);

  const settings = await req("/api/admin/settings", { cookie });
  const badSettings = await req("/api/admin/settings", { method: "PUT", cookie, headers: ORIGIN, json: { ...settings.body, socials: { ...settings.body.socials, instagram: "javascript:alert(1)" } } });
  check("settings reject javascript: social links", badSettings.status === 422);
  const okSettings = await req("/api/admin/settings", { method: "PUT", cookie, headers: ORIGIN, json: settings.body });
  check("settings save", okSettings.status === 200);

  for (const p of ["/api/admin/messages", "/api/admin/enquiries", "/api/admin/subscribers", "/api/admin/conversations", "/api/admin/team"]) {
    check(`GET ${p}`, (await req(p, { cookie })).status === 200);
  }
  const csv = await req("/api/admin/subscribers?format=csv", { cookie });
  check("subscribers CSV export", csv.status === 200 && String(csv.body).startsWith("email,subscribed_at,unsubscribe_url"));
  const convo = await req(`/api/admin/conversations/${conv}`, { cookie });
  check("admin can read the chat transcript", convo.status === 200 && convo.body.messages.length >= 4);
  for (const p of ["/admin", "/admin/orders", "/admin/products", "/admin/enquiries", "/admin/conversations", "/admin/subscribers", "/admin/settings", "/admin/team", "/admin/messages", "/admin/categories", "/admin/features"]) {
    check(`admin page ${p} renders`, (await req(p, { cookie })).status === 200);
  }

  // ── upload: a fake "image" must be rejected ──
  const form = new FormData();
  form.append("file", new Blob(["<script>alert(1)</script>"], { type: "image/png" }), "evil.png");
  const up = await fetch(BASE + "/api/admin/upload", { method: "POST", body: form, headers: { Cookie: cookie, Origin: BASE } });
  check("upload rejects a script disguised as PNG", up.status === 415);

  // ── cron ──
  check("cron cleanup requires secret", (await req("/api/cron/cleanup")).status === 401);
  if (process.env.CRON_SECRET) check("cron cleanup runs with secret", (await req("/api/cron/cleanup", { headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } })).status === 200);

  // ── logout ──
  await req("/api/admin/logout", { method: "POST", cookie, headers: ORIGIN });

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
