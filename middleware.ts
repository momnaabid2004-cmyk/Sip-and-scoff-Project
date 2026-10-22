import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";

const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** True when the request's Origin header names this same site. */
function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return null; // header absent
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * 1. CSRF: state-changing API calls must come from this site (browsers always send Origin on POST/PUT/PATCH/DELETE).
 * 2. Admin gate: /admin and /api/admin need a valid login cookie. Fine-grained role checks happen in each route.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdminApi = pathname.startsWith("/api/admin");

  if (pathname.startsWith("/api/") && UNSAFE.has(req.method)) {
    const same = sameOrigin(req);
    // admin writes: Origin is mandatory. Public writes: reject only a foreign Origin (mail apps' one-click unsubscribe sends none).
    if (same === false || (isAdminApi && same === null)) return NextResponse.json({ error: "Cross-site request blocked." }, { status: 403 });
  }

  const needsAuth = pathname.startsWith("/admin") || isAdminApi;
  const isLogin = pathname === "/admin/login" || pathname === "/api/admin/login";
  if (!needsAuth || isLogin) return NextResponse.next();

  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value).catch(() => null);
  if (session) return NextResponse.next();

  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/admin/:path*", "/api/:path*"] };
