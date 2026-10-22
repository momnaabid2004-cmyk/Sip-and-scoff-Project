import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, parseBody, rateLimited, tooMany } from "@/lib/api";
import { publicOrder } from "@/lib/public-order";

const schema = z.object({
  code: z.string().trim().min(3, "Enter your order number, e.g. SS-1001").max(20),
  phone: z.string().trim().min(10, "Enter the mobile number used at checkout").max(20),
});


/** POST (not GET) so the phone number never lands in URLs, browser history or server logs. */
export async function POST(req: Request) {
  if (await rateLimited(`track:${clientIp(req)}`, 20)) return tooMany("Too many lookups — please wait a few minutes.");
  const body = await parseBody(req, schema);
  if (body.error) return body.error;
  const order = await db.orders.track(body.data.code, body.data.phone);
  if (!order) return NextResponse.json({ error: "We couldn't find an order with that number and mobile number. Please check both and try again." }, { status: 404 });
  return NextResponse.json(publicOrder(order));
}
