import { NextResponse, after } from "next/server";
import { db } from "@/lib/db";
import { orderInput } from "@/lib/db/schemas";
import { clientIp, parseBody, rateLimited, tooMany } from "@/lib/api";
import { optionsLabel, unitPrice, validateChoices } from "@/lib/pricing";
import { notifyNewOrder } from "@/lib/email";

/** Place an order. Prices and options are re-checked here from the database — the browser's numbers are never trusted. */
export async function POST(req: Request) {
  if (await rateLimited(`order:${clientIp(req)}`, 10)) return tooMany("Too many orders from this device — please call or WhatsApp us.");
  const body = await parseBody(req, orderInput);
  if (body.error) return body.error;
  const { items, type, customer, payment } = body.data;

  if (type === "delivery") {
    const errors: Record<string, string> = {};
    if (!customer.address) errors["customer.address"] = "Address is required";
    if (!customer.area) errors["customer.area"] = "Choose your area";
    if (Object.keys(errors).length) return NextResponse.json({ error: "Please add your delivery address and area.", errors }, { status: 422 });
  }

  const [products, settings] = await Promise.all([db.products.list(), db.settings.get()]);
  if (type === "delivery" && !settings.deliveryAreas.some((a) => a.toLowerCase() === customer.area.toLowerCase()))
    return NextResponse.json({ error: "Sorry, we don't deliver to that area yet — choose pickup or WhatsApp us.", errors: { "customer.area": "Not in our delivery areas" } }, { status: 422 });

  const lines = [];
  for (const it of items) {
    const p = products.find((x) => x.id === it.productId);
    if (!p || !p.available) return NextResponse.json({ error: "Sorry, an item in your cart is no longer available. Please refresh your cart." }, { status: 409 });
    const choices = validateChoices(p, it.choiceIds);
    if (!choices.ok) return NextResponse.json({ error: choices.error }, { status: 422 });
    lines.push({ productId: p.id, name: p.name, unitPrice: unitPrice(p, choices.choiceIds), qty: it.qty, options: optionsLabel(p.options, choices.choiceIds) });
  }
  const subtotal = lines.reduce((a, l) => a + l.unitPrice * l.qty, 0);
  const deliveryFee = type === "pickup" || subtotal >= settings.freeDeliveryOver ? 0 : settings.deliveryFee;
  const order = await db.orders.create({
    type,
    customer: type === "pickup" ? { ...customer, address: "", area: "" } : customer,
    items: lines,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    payment,
  });
  after(() => notifyNewOrder(order)); // email the owner after the response is sent
  return NextResponse.json({ id: order.id, code: order.code, total: order.total }, { status: 201 });
}
