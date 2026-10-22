"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/art/Logo";
import { ProductArt } from "@/components/art/ProductArt";
import { useApi } from "@/hooks/useApi";
import { EyeIcon, EyeOffIcon } from "@/components/ui/Icons";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const { call, busy, error } = useApi();

  return (
    <div className="grid min-h-[100svh] lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r-2 border-cocoa bg-lagoon p-10 lg:flex">
        <Logo />
        <div className="grid grid-cols-3 gap-4" aria-hidden="true">
          {(["cup", "cone", "mojito", "chai-glass", "shake", "sandwich"] as const).map((k, i) => (
            <div key={k} className="aspect-square rounded-[28px] border-2 border-cocoa bg-vanilla-50 p-4 shadow-pop-sm" style={{ transform: `rotate(${(i % 2 ? 1 : -1) * 4}deg)` }}>
              <ProductArt kind={k} tint={["#D1A06A", "#F7C9D4", "#9ED89A", "#C58A55", "#F59AB0", "#F2C14E"][i]} />
            </div>
          ))}
        </div>
        <p className="h-display text-4xl">Run the café,<br />from anywhere.</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <form
          className="w-full max-w-sm"
          onSubmit={async (e) => {
            e.preventDefault();
            const ok = await call("/api/admin/login", { body: { email, password } });
            if (ok) {
              router.replace(next);
              router.refresh();
            }
          }}
        >
          <div className="lg:hidden"><Logo /></div>
          <h1 className="h-display mt-8 text-4xl">Staff login</h1>
          <p className="mt-2 text-sm text-cocoa-muted">Manage menu, features, orders and your team.</p>
          <div className="mt-8 space-y-4">
            <div>
              <label htmlFor="em" className="label">Email</label>
              <input id="em" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
            </div>
            <div>
              <label htmlFor="pw" className="label">Password</label>
              <div className="relative">
                <input id="pw" type={show ? "text" : "password"} required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input !pr-12" />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-cocoa-muted hover:bg-cocoa/5" aria-label={show ? "Hide password" : "Show password"}>
                  {show ? <EyeOffIcon width={16} /> : <EyeIcon width={16} />}
                </button>
              </div>
            </div>
            {error && <p role="alert" className="rounded-2xl bg-berry-light px-4 py-3 text-sm font-bold text-berry-600">{error}</p>}
            <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? "Signing in…" : "Sign in"}</button>
          </div>
          <Link href="/" className="mt-6 block text-center text-sm font-bold text-cocoa-muted hover:text-cocoa">← Back to website</Link>
        </form>
      </div>
    </div>
  );
}
