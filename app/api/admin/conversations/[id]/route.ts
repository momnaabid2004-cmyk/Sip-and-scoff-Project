import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";
import { notFound } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { error } = await requireAdmin("chats:read");
  if (error) return error;
  const c = await db.chat.getConversation((await params).id);
  return c ? NextResponse.json(c) : notFound("Conversation");
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { error } = await requireAdmin("chats:write");
  if (error) return error;
  return (await db.chat.removeConversation((await params).id)) ? NextResponse.json({ ok: true }) : notFound("Conversation");
}
