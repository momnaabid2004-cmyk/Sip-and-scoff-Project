import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";
import { notFound } from "@/lib/api";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin("subscribers:read");
  if (error) return error;
  return (await db.subscribers.remove((await params).id)) ? NextResponse.json({ ok: true }) : notFound("Subscriber");
}
