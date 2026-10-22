# Sip & Scoop — QA & Security Report

**Date:** 18 Oct 2026 · **Scope:** the full-stack project after the backend build (Next.js 15.5 · Supabase Postgres · Drizzle · Gemini AI agent)
**Method:** `npm ci`, `tsc --noEmit`, `next build`, `npm audit`, secret scan, 66 automated end-to-end API checks (`npm run test:api`), 22 AI-agent checks with a mock model (`npm run test:ai`), opening-hours unit tests, browser tests in Chromium (desktop + 390 px mobile, console errors, horizontal overflow), manual abuse tests (rate limits, session revocation, CSRF, forged cookies, fake uploads).

**What could not be tested here:** live Gemini responses (no API key in this environment). The AI was tested end to end with the AI SDK's official mock model: streaming, tools, database writes, leak guard and outage fallback. Live Supabase/Resend calls were not tested either; the same code ran against a local PostgreSQL 16 database. Run `npm run test:api` once against your Supabase database and send one real chat message after deploying.

---

## 1. Findings in the original project — all FIXED

| ID | Severity | Category | Location | Problem | Fix applied |
|---|---|---|---|---|---|
| QA-001 | Critical | Data / Deployment | `lib/db/json-store.ts` | All data lived in one JSON file. On Vercel, orders, edits and messages were lost on every restart. | Replaced with PostgreSQL on Supabase via Drizzle (`lib/db/schema.ts`, `lib/db/store.ts`), with migrations and a seed script. |
| SEC-001 | Critical | Auth / Secrets | `lib/auth/session.ts` | A missing `AUTH_SECRET` in production fell back to a public default key. Anyone could forge an owner login cookie. | Production now refuses to run without a secret of 32+ characters. |
| SEC-002 | High | Secrets | `.gitignore` | `.env` was not ignored, so API keys and database passwords could be committed to GitHub. | `.env` and `.env.*` are now ignored (except `.env.example`). |
| SEC-003 | High | Rate limiting | `lib/api.ts` | The limiter was in memory (reset per serverless instance and restart) and keyed on the first `x-forwarded-for` value, which any client can spoof. | Limiter moved to Postgres, so it holds across instances. IP comes from Vercel's trusted headers. Login is limited per IP **and** per email. |
| SEC-004 | High | Supabase exposure | *(new database)* | Supabase serves `public` tables through its REST API to anyone with the public anon key. | Migration `0001_enable_rls.sql` enables Row Level Security with no policies on all 13 tables, which blocks that API. |
| SEC-005 | High | Dependencies | `next` → nested `postcss@8.4.31` | Advisories GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q and others. | Next's nested PostCSS is pinned to 8.5.30 with `overrides`. `npm audit --omit=dev` now reports **0 vulnerabilities**. |
| SEC-006 | Medium | CSRF | `middleware.ts` | No origin check on state-changing requests. SameSite=Lax was the only protection. | POST/PUT/PATCH/DELETE to `/api/*` with a foreign `Origin` are rejected. Admin writes also require `Origin`. |
| SEC-007 | Medium | Headers | `next.config.mjs` | No CSP, HSTS, X-Frame-Options or nosniff. | Full header set added. Admin and API responses are `no-store`, and admin pages are `noindex`. |
| SEC-008 | Medium | SSRF / abuse | `next.config.mjs` `remotePatterns: "**"` | The image optimiser would fetch and resize **any** URL, effectively an open proxy. | Only `*.supabase.co` plus `NEXT_PUBLIC_IMAGE_HOSTS` are allowed. Other pasted URLs display without optimisation. |
| SEC-009 | Medium | File upload | `app/api/admin/upload/route.ts` | The browser-declared MIME type was trusted, and files went to local disk (lost on Vercel). | Magic bytes are checked (`lib/storage.ts`), a size limit applies before parsing, files go to Supabase Storage, and `nosniff` is set on local files. |
| SEC-010 | Medium | Session | `lib/auth/guard.ts` | After a password change, old cookies on other devices stayed valid for up to 7 days. | Added `session_version`. A password, role or active-status change logs out every other device; the current device gets a fresh cookie. |
| SEC-011 | Medium | Stored XSS (admin-only) | `lib/db/schemas.ts` | Social links and product image fields accepted `javascript:` URLs. | Social links must be `http(s)://`. Images must be `https://` or an upload path. |
| SEC-012 | Medium | AI prompt injection | `app/api/chat/route.ts` | The browser sent the whole chat history, so a client could fake "assistant" turns to steer the model. | History is now loaded from the database by conversation ID. The browser sends only the new message. |
| SEC-013 | Low | User enumeration | `app/api/admin/login/route.ts` | An unknown email returned faster than a wrong password. | A dummy scrypt check runs for unknown emails, so timing is the same. |
| QA-002 | Medium | Functional | `lib/ai/local-agent.ts` `openNow()` | "Are you open now?" ignored the admin's hours (hardcoded 9 AM to 1/2 AM). | New `lib/hours.ts` parses the admin hours, including closing after midnight, in Pakistan time. Unit-tested. |
| QA-003 | Medium | Functional | `app/(site)/page.tsx`, local agent | Logic was keyed on seed category IDs (`"coffee"`), so admin-created categories were ignored. | Categories are matched by slug and name. |
| QA-004 | Medium | Validation | `app/api/orders/route.ts` | Options from another product, or two sizes in a "pick one" group, were accepted. | `validateChoices()` enforces ownership, single-choice and required groups. Delivery area is checked against settings. |
| QA-005 | Medium | Functional | `app/admin/(panel)/page.tsx` | "Today" was calculated in the server's timezone (UTC on Vercel), five hours off Pakistan. | Uses Asia/Karachi. |
| QA-006 | Low | Data integrity | order codes | `count + 1001` could produce duplicate codes under concurrency. | Generated by a Postgres sequence (`SS-` + 1000 + serial). |
| QA-007 | Low | Content | `components/sections/home/Concierge.tsx` | The demo chat showed fixed prices that drift from the real menu. | Built from live products and delivery settings. |
| QA-008 | Low | Functional | newsletter | Sign-ups went to the inbox as messages, with no dedupe or unsubscribe. | New `subscribers` table with dedupe, private unsubscribe links and CSV export. |
| QA-009 | Low | Functional | login response | Returned a stale `lastLoginAt`. | Returns the updated row. |
| QA-010 | Low | Functional (found in testing) | local agent | "Where is my order…" was answered as a location question. | Intent order fixed. Covered by `test:ai`. |

## 2. Remaining items (open — your decision)

| ID | Severity | Category | Location | Issue | Recommendation |
|---|---|---|---|---|---|
| SEC-R1 | Medium | Default credentials | seed / `.env` | The owner password is the requested default `ChangeMe123!`. | Change it in Admin → Team right after the first login (the seed prints a warning). |
| SEC-R2 | Low | CSP | `next.config.mjs` | `script-src 'unsafe-inline'` is needed by Next.js without per-request nonces. | Acceptable. Nonce-based CSP is possible later (it makes every page dynamic). |
| SEC-R3 | Low | Availability | login rate limit | Limiting per email means an attacker can lock the owner out for 10 minutes. | Accepted trade-off against password guessing. Could add CAPTCHA (Cloudflare Turnstile) later. |
| SEC-R4 | Low | Dependencies (dev only) | `drizzle-kit` → esbuild ≤ 0.24, `braces` | Affect only the local dev tooling, never the live site. | Update drizzle-kit when a fixed release ships. |
| SEC-R5 | Medium | Platform | `next@15.5.28` | The PostCSS fix is pinned manually. Next 16 includes it natively. | Plan a Next 16 upgrade (middleware → proxy rename, a few API changes). |
| QA-R1 | Low | Tooling | `package.json` | No ESLint config (`next lint` does nothing). | Add `eslint-config-next` if you want linting in CI. |
| QA-R2 | Low | Scalability | admin Orders / Messages | Lists load everything (fine at café volume). The dashboard caps at 500 orders. | Add pagination when orders exceed a few thousand. |
| QA-R3 | Low | Legal | — | No privacy policy page, though the site stores names, phones and chats. | The client must provide the text; it takes a few minutes to add. |
| QA-R4 | Info | Content | Settings | The knowledge base, contact numbers and address are sample or placeholder data. | Replace before launch (README §12). |

## 3. Summary

| Severity | Fixed | Open |
|---|---|---|
| Critical | 2 | 0 |
| High | 4 | 0 |
| Medium | 11 | 2 |
| Low | 6 | 6 (+1 info) |

**Scores**
- **Quality: 8.5 / 10.** Typed end to end, validated, with every flow tested automatically. Pagination, linting and a privacy page are still missing.
- **Security: 8.5 / 10.** OWASP Top 10 basics are covered (authentication, access control, injection, CSRF, headers, rate limits, RLS, upload checks). The remaining points are the default password and the Next 16 upgrade.

**Production readiness: ✅ Ready with fixes.** Change the owner password, replace the sample content and set the environment variables in Vercel. Nothing in the code blocks launch.
