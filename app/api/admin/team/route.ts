import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminCreateInput } from "@/lib/db/schemas";
import { requireAdmin, toPublic } from "@/lib/auth/guard";
import { canManageRole } from "@/lib/auth/permissions";
import { hashPassword } from "@/lib/auth/password";
import { parseBody } from "@/lib/api";

export async function GET() {
  const { error } = await requireAdmin("team:read");
  if (error) return error;
  return NextResponse.json((await db.admins.list()).map(toPublic));
}

export async function POST(req: Request) {
  const { admin, error } = await requireAdmin("team:write");
  if (error) return error;
  const body = await parseBody(req, adminCreateInput);
  if (body.error) return body.error;
  const { name, email, role, password } = body.data;
  if (!canManageRole(admin.role, role)) return NextResponse.json({ error: "Only an owner can add another owner." }, { status: 403 });
  if (await db.admins.getByEmail(email)) return NextResponse.json({ error: "A member with this email already exists.", errors: { email: "Already in use" } }, { status: 422 });
  const user = await db.admins.create({ name, email, role, active: true, passwordHash: await hashPassword(password) });
  return NextResponse.json(toPublic(user), { status: 201 });
}
