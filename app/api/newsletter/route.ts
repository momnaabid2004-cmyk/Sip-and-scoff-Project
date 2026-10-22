import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, parseBody, rateLimited, tooMany } from "@/lib/api";

const schema = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email address").max(200), company: z.string().optional() });

/** Newsletter sign-up → subscribers table (duplicates ignored; each subscriber has a private unsubscribe link). */
export async function POST(req: Request) {
  if (await rateLimited(`nl:${clientIp(req)}`, 5)) return tooMany("Too many attempts — try again later.");
  const body = await parseBody(req, schema);
  if (body.error) return body.error;
  if (body.data.company) return NextResponse.json({ ok: true }); // honeypot
  const result = await db.subscribers.subscribe(body.data.email);
  // same answer whether or not the email was already subscribed — doesn't reveal who is on the list
  return NextResponse.json({ ok: true }, { status: result === "created" ? 201 : 200 });
}
