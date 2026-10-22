import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";
import { notFound, parseBody } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { error } = await requireAdmin("messages:read");
  if (error) return error;
  const body = await parseBody(req, z.object({ read: z.boolean() }));
  if (body.error) return body.error;
  const m = await db.messages.setRead((await params).id, body.data.read);
  return m ? NextResponse.json(m) : notFound("Message");
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { error } = await requireAdmin("messages:read");
  if (error) return error;
  return (await db.messages.remove((await params).id)) ? NextResponse.json({ ok: true }) : notFound("Message");
}
