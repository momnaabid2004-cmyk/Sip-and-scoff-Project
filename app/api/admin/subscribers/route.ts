import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";
import { siteUrl } from "@/lib/api";

/** GET /api/admin/subscribers  (?format=csv → download with each person's unsubscribe link for your email tool) */
export async function GET(req: Request) {
  const { error } = await requireAdmin("subscribers:read");
  if (error) return error;
  const rows = await db.subscribers.list();
  if (new URL(req.url).searchParams.get("format") !== "csv") return NextResponse.json(rows);

  const active = rows.filter((r) => r.active);
  const cell = (v: string) => `"${v.replace(/"/g, '""').replace(/^[=+\-@\t\r]/, "'$&")}"`; // also blocks spreadsheet formula injection
  const lines = ["email,subscribed_at,unsubscribe_url"];
  for (const r of active) {
    const token = await db.subscribers.tokenFor(r.email);
    lines.push([cell(r.email), cell(r.createdAt), cell(`${siteUrl()}/api/newsletter/unsubscribe?token=${token}`)].join(","));
  }
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" },
  });
}
