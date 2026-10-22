import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { db } from "@/lib/db";

/**
 * Daily housekeeping (scheduled in vercel.json): deletes AI chats older than CHAT_RETENTION_DAYS (default 30)
 * and expired rate-limit rows. Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET ?? "";
  const given = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const ok = secret.length >= 16 && given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const days = Math.max(1, Number(process.env.CHAT_RETENTION_DAYS ?? 30));
  const result = await db.maintenance.cleanup(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
  return NextResponse.json({ ok: true, retentionDays: days, deleted: result });
}
