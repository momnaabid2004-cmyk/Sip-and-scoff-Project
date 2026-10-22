import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";

export async function GET() {
  const { error } = await requireAdmin("orders:read");
  if (error) return error;
  return NextResponse.json(await db.orders.list());
}
