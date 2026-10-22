/**
 * Stateless signed session (HMAC-SHA256 via Web Crypto) — works in middleware (edge) and route handlers.
 * Cookie value: base64url(JSON payload) + "." + base64url(signature)
 */
import type { Role } from "@/lib/db/types";

export const SESSION_COOKIE = "ss_admin";
export const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days
export const SESSION_COOKIE_OPTIONS = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/" };

/** v = the member's sessionVersion when they logged in — a password/role change bumps it and logs them out everywhere. */
export type SessionPayload = { sub: string; role: Role; name: string; v: number; exp: number };

const enc = new TextEncoder();
const b64url = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const fromB64url = (s: string) => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

function secret() {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32) return s;
  // Never run a live site with a guessable signing key — anyone could forge an admin cookie.
  if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET must be set to a random string of at least 32 characters.");
  return s || "dev-only-insecure-secret-change-me-0000000000";
}

async function key() {
  return crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function signSession(p: Omit<SessionPayload, "exp">) {
  const payload: SessionPayload = { ...p, exp: Math.floor(Date.now() / 1000) + SESSION_TTL };
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await key(), enc.encode(body));
  return `${body}.${b64url(sig)}`;
}

export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await key(), fromB64url(sig), enc.encode(body));
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(body))) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
