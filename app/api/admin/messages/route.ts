import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";

export async function GET() {
  const { error } = await requireAdmin("messages:read");
  if (error) return error;
  return NextResponse.json(await db.messages.list());
}
