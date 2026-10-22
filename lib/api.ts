import "server-only";
import { createHmac } from "crypto";
import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { SITE_TAG } from "@/lib/cache-tags";
import { sql } from "drizzle-orm";
import type { z, ZodTypeAny } from "zod";
import { fieldErrors } from "@/lib/db/schemas";
import { orm, schema as t } from "@/lib/db/client";

/** Parse + validate a JSON body. Returns data or a 422 with per-field errors. */
export async function parseBody<S extends ZodTypeAny>(req: Request, schema: S, raw?: unknown): Promise<{ data: z.output<S>; error?: never } | { data?: never; error: NextResponse }> {
  const body = raw !== undefined ? raw : await req.json().catch(() => null);
  if (body === null || typeof body !== "object") return { error: NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }) };
  const r = schema.safeParse(body);
  if (!r.success) return { error: NextResponse.json({ error: "Please fix the highlighted fields.", errors: fieldErrors(r.error) }, { status: 422 }) };
  return { data: r.data };
}

export const notFound = (what = "Item") => NextResponse.json({ error: `${what} not found.` }, { status: 404 });
export const tooMany = (msg = "Too many requests — please try again in a few minutes.") => NextResponse.json({ error: msg }, { status: 429 });

/** Public pages are cached — clear that cache after any admin change that affects the site. */
export function refreshSite() {
  revalidateTag(SITE_TAG);
  revalidatePath("/", "layout");
}

/**
 * Fixed-window rate limiter stored in Postgres, so it holds across every serverless instance and restart.
 * Returns true when the caller is over the limit. Fails open (never blocks real customers) if the DB hiccups.
 */
export async function rateLimited(key: string, max = 8, windowMs = 10 * 60 * 1000): Promise<boolean> {
  const window = Math.floor(Date.now() / windowMs);
  const k = `${key}:${window}`;
  try {
    const [row] = await orm
      .insert(t.rateLimits)
      .values({ key: k, count: 1, expiresAt: new Date((window + 1) * windowMs) })
      .onConflictDoUpdate({ target: t.rateLimits.key, set: { count: sql`${t.rateLimits.count} + 1` } })
      .returning({ count: t.rateLimits.count });
    // opportunistic clean-up of old windows (≈1% of calls)
    if (Math.random() < 0.01) void orm.delete(t.rateLimits).where(sql`${t.rateLimits.expiresAt} < now()`).catch(() => {});
    return row.count > max;
  } catch (e) {
    console.error("[rate-limit] failed, allowing request", (e as Error).message);
    return false;
  }
}

/**
 * Client IP. On Vercel `x-real-ip` / `x-vercel-forwarded-for` are set by the platform and can't be spoofed;
 * elsewhere we fall back to the LAST entry of x-forwarded-for (the one added by your own proxy).
 */
export function clientIp(req: Request) {
  const h = req.headers;
  const vercel = h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (vercel) return vercel;
  const real = h.get("x-real-ip")?.trim();
  if (real) return real;
  const xff = h.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean);
  return xff?.length ? xff[xff.length - 1] : "local";
}

/** Salted one-way hash of an IP — lets us group abuse without storing personal data. */
export const hashIp = (ip: string) => createHmac("sha256", process.env.AUTH_SECRET ?? "dev").update(ip).digest("hex").slice(0, 32);

/** Escape text for safe use inside HTML emails. */
export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")).replace(/\/$/, "");
