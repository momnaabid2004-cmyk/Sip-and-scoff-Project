import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminUpdateInput } from "@/lib/db/schemas";
import { requireAdmin, toPublic } from "@/lib/auth/guard";
import { canManageRole } from "@/lib/auth/permissions";
import { hashPassword } from "@/lib/auth/password";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS, SESSION_TTL, signSession } from "@/lib/auth/session";
import { notFound, parseBody } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const { admin, error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const target = await db.admins.get(id);
  if (!target) return notFound("Member");
  const body = await parseBody(req, adminUpdateInput);
  if (body.error) return body.error;
  const { password, ...rest } = body.data;

  const self = target.id === admin.id;
  // anyone can change their own name / password; everything else needs team rights
  const touchesOthers = !self || rest.role !== undefined || rest.active !== undefined;
  if (touchesOthers) {
    if (admin.role === "editor") return NextResponse.json({ error: "Your role doesn't allow this action." }, { status: 403 });
    if (!canManageRole(admin.role, target.role) || (rest.role && !canManageRole(admin.role, rest.role)))
      return NextResponse.json({ error: "Only an owner can change owners." }, { status: 403 });
  }
  if (self && rest.active === false) return NextResponse.json({ error: "You can't deactivate yourself." }, { status: 409 });
  if (target.role === "owner" && ((rest.role && rest.role !== "owner") || rest.active === false) && (await db.admins.countActiveOwners()) <= 1)
    return NextResponse.json({ error: "There must always be at least one active owner." }, { status: 409 });

  const updated = await db.admins.update(id, { ...rest, ...(password ? { passwordHash: await hashPassword(password) } : {}) });
  if (!updated) return notFound("Member");
  const res = NextResponse.json(toPublic(updated));
  // changing your own password/role logs out other devices — keep THIS browser logged in with a fresh cookie
  if (self && updated.sessionVersion !== target.sessionVersion) {
    const token = await signSession({ sub: updated.id, role: updated.role, name: updated.name, v: updated.sessionVersion });
    res.cookies.set(SESSION_COOKIE, token, { ...SESSION_COOKIE_OPTIONS, maxAge: SESSION_TTL });
  }
  return res;
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { admin, error } = await requireAdmin("team:write");
  if (error) return error;
  const { id } = await params;
  const target = await db.admins.get(id);
  if (!target) return notFound("Member");
  if (target.id === admin.id) return NextResponse.json({ error: "You can't remove yourself." }, { status: 409 });
  if (!canManageRole(admin.role, target.role)) return NextResponse.json({ error: "Only an owner can remove an owner." }, { status: 403 });
  if (target.role === "owner" && target.active && (await db.admins.countActiveOwners()) <= 1) return NextResponse.json({ error: "There must always be at least one active owner." }, { status: 409 });
  await db.admins.remove(id);
  return NextResponse.json({ ok: true });
}
