import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";

export async function GET() {
  const { admin, error } = await requireAdmin();
  return error ?? NextResponse.json({ admin });
}
