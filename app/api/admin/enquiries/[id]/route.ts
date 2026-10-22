import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";
import { notFound, parseBody } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };
const schema = z.object({ status: z.enum(["new", "contacted", "confirmed", "closed"]) });

export async function PATCH(req: Request, { params }: Ctx) {
  const { error } = await requireAdmin("enquiries:write");
  if (error) return error;
  const body = await parseBody(req, schema);
  if (body.error) return body.error;
  const e = await db.enquiries.setStatus((await params).id, body.data.status);
  return e ? NextResponse.json(e) : notFound("Request");
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { error } = await requireAdmin("enquiries:write");
  if (error) return error;
  return (await db.enquiries.remove((await params).id)) ? NextResponse.json({ ok: true }) : notFound("Request");
}
