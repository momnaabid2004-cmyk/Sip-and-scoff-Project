import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";
import { notFound, parseBody } from "@/lib/api";

const schema = z.object({ status: z.enum(["new", "confirmed", "preparing", "on-the-way", "completed", "cancelled"]) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin("orders:write");
  if (error) return error;
  const body = await parseBody(req, schema);
  if (body.error) return body.error;
  const o = await db.orders.setStatus((await params).id, body.data.status);
  return o ? NextResponse.json(o) : notFound("Order");
}
