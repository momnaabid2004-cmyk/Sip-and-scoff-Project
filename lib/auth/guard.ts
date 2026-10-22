import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { AdminUser, PublicAdmin } from "@/lib/db/types";
import { SESSION_COOKIE, verifySession } from "./session";
import { can, type Permission } from "./permissions";

export const toPublic = ({ passwordHash: _p, sessionVersion: _v, ...rest }: AdminUser): PublicAdmin => rest;

/** Current admin (re-checked against the DB so removed / deactivated members lose access immediately). */
export async function currentAdmin(): Promise<PublicAdmin | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const s = await verifySession(token);
  if (!s) return null;
  const user = await db.admins.get(s.sub);
  // removed, deactivated, or password/role changed since this cookie was issued → logged out
  if (!user || !user.active || user.sessionVersion !== s.v) return null;
  return toPublic(user);
}

/** For API routes: returns the admin, or a ready-made 401/403 response. */
export async function requireAdmin(permission?: Permission): Promise<{ admin: PublicAdmin; error?: never } | { admin?: never; error: NextResponse }> {
  const admin = await currentAdmin();
  if (!admin) return { error: NextResponse.json({ error: "Please log in again." }, { status: 401 }) };
  if (permission && !can(admin.role, permission)) return { error: NextResponse.json({ error: "Your role doesn't allow this action." }, { status: 403 }) };
  return { admin };
}
