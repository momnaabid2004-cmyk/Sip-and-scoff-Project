"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApi } from "@/hooks/useApi";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { Food3D } from "@/components/three/Food3D";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState("");
  const [done, setDone] = useState(false);
  const { call, busy, error, fields } = useApi();
  const err = fields.email ?? error;

  return (
    <section className="relative overflow-hidden bg-saffron px-4 py-20 text-center sm:py-28" aria-labelledby="nl-title">
      <div className="pointer-events-none absolute -left-10 bottom-0 hidden aspect-square w-48 md:block lg:w-64" aria-hidden="true"><Food3D kind="kulfi" tint="#FCE3A6" /></div>
      <div className="pointer-events-none absolute -right-6 top-6 hidden aspect-square w-40 md:block lg:w-56" aria-hidden="true"><Food3D kind="iced" tint="#B9814F" /></div>
      <p className="eyebrow !text-espresso">The slow coffee club</p>
      <SplitReveal id="nl-title" className="h-display mx-auto mt-4 max-w-3xl text-[clamp(2.3rem,5.5vw,4.4rem)]">New blends, seasonal scoops and the <em>occasional invitation</em></SplitReveal>
      <AnimatePresence mode="wait">
        {done ? (
          <motion.p key="ok" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="hand mx-auto mt-10 text-4xl text-espresso" role="status">You&apos;re in — welcome to the club!</motion.p>
        ) : (
          <motion.form
            key="f"
            exit={{ opacity: 0, y: -10 }}
            noValidate
            onSubmit={async (e) => {
              e.preventDefault();
              if (await call("/api/newsletter", { body: { email, company: hp } })) setDone(true);
            }}
            className="mx-auto mt-10 max-w-lg"
          >
            <div className="flex flex-col gap-2 rounded-[28px] bg-vanilla p-2 sm:flex-row sm:rounded-full">
              <label htmlFor="nl-email" className="sr-only">Email address</label>
              <input id="nl-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" aria-invalid={!!err} aria-describedby={err ? "nl-err" : undefined} className="min-h-[48px] flex-1 rounded-full bg-transparent px-5 text-center text-[15px] placeholder:text-espresso-muted/70 focus:outline-none sm:text-left" />
              <input tabIndex={-1} aria-hidden="true" autoComplete="off" className="hidden" value={hp} onChange={(e) => setHp(e.target.value)} />
              <button type="submit" disabled={busy} className="btn-dark">{busy ? "Joining…" : "Subscribe"}</button>
            </div>
            {err && <p id="nl-err" role="alert" className="mt-3 text-sm text-cherry-700">{err}</p>}
          </motion.form>
        )}
      </AnimatePresence>
    </section>
  );
}
