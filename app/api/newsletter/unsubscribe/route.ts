import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientIp, rateLimited, siteUrl } from "@/lib/api";

/** One-click unsubscribe link: /api/newsletter/unsubscribe?token=… → redirects to /unsubscribed */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const limited = await rateLimited(`unsub:${clientIp(req)}`, 20);
  const ok = !limited && (await db.subscribers.unsubscribe(token));
  return NextResponse.redirect(`${siteUrl()}/unsubscribed?ok=${ok ? 1 : 0}`, 303);
}
/** RFC 8058 one-click (mail apps POST to the same URL). */
export const POST = GET;
