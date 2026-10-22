import { NextResponse, after } from "next/server";
import { db } from "@/lib/db";
import { messageInput } from "@/lib/db/schemas";
import { clientIp, parseBody, rateLimited, tooMany } from "@/lib/api";
import { notifyNewMessage } from "@/lib/email";

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  if (raw && typeof raw === "object" && (raw as { company?: string }).company) return NextResponse.json({ ok: true }); // honeypot: bots fill the hidden field
  if (await rateLimited(`contact:${clientIp(req)}`, 5)) return tooMany("Too many messages — please try again later.");
  const body = await parseBody(req, messageInput, raw);
  if (body.error) return body.error;
  await db.messages.create(body.data);
  after(() => notifyNewMessage(body.data));
  return NextResponse.json({ ok: true }, { status: 201 });
}
