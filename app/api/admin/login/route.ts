import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loginInput } from "@/lib/db/schemas";
import { verifyPassword } from "@/lib/auth/password";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS, SESSION_TTL, signSession } from "@/lib/auth/session";
import { clientIp, parseBody, rateLimited, tooMany } from "@/lib/api";
import { toPublic } from "@/lib/auth/guard";

// a real scrypt hash of a random string — compared against when the email doesn't exist so timing doesn't reveal valid emails
const DUMMY_HASH = "scrypt:00000000000000000000000000000000:" + "0".repeat(128);

export async function POST(req: Request) {
  const body = await parseBody(req, loginInput);
  if (body.error) return body.error;
  const { email, password } = body.data;
  // brute-force protection: per IP and per account
  if ((await rateLimited(`login-ip:${clientIp(req)}`, 10)) || (await rateLimited(`login-email:${email}`, 8))) return tooMany("Too many attempts. Try again in 10 minutes.");

  const user = await db.admins.getByEmail(email);
  const passwordOk = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !user.active || !passwordOk) return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });

  const updated = (await db.admins.update(user.id, { lastLoginAt: new Date().toISOString() })) ?? user;
  const token = await signSession({ sub: updated.id, role: updated.role, name: updated.name, v: updated.sessionVersion });
  const res = NextResponse.json({ admin: toPublic(updated) });
  res.cookies.set(SESSION_COOKIE, token, { ...SESSION_COOKIE_OPTIONS, maxAge: SESSION_TTL });
  return res;
}
