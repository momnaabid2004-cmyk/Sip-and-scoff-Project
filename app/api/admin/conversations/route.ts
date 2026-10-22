import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";

/** GET /api/admin/conversations?page=1 — AI chat transcripts, newest first (20 per page). */
export async function GET(req: Request) {
  const { error } = await requireAdmin("chats:read");
  if (error) return error;
  const page = Math.max(1, Math.min(10_000, Number(new URL(req.url).searchParams.get("page")) || 1));
  return NextResponse.json(await db.chat.listConversations({ page, pageSize: 20 }));
}
