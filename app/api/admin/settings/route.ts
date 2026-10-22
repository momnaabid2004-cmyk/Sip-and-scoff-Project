import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { settingsInput } from "@/lib/db/schemas";
import { requireAdmin } from "@/lib/auth/guard";
import { parseBody, refreshSite } from "@/lib/api";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  return NextResponse.json(await db.settings.get());
}

export async function PUT(req: Request) {
  const { error } = await requireAdmin("settings:write");
  if (error) return error;
  const body = await parseBody(req, settingsInput);
  if (body.error) return body.error;
  const s = await db.settings.update(body.data);
  refreshSite();
  return NextResponse.json(s);
}
