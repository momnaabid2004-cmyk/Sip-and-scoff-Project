"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApi } from "@/hooks/useApi";
import { Field, errProps } from "@/components/ui/Field";

const EMPTY = { name: "", email: "", phone: "", subject: "", message: "" };

export function ContactForm() {
  const [v, setV] = useState(EMPTY);
  const [hp, setHp] = useState("");
  const [sent, setSent] = useState(false);
  const { call, busy, error, fields } = useApi();
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV((x) => ({ ...x, [k]: e.target.value }));

  return (
    <div className="card p-6 sm:p-8">
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div key="ok" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-12 text-center" role="status">
            
            <h2 className="h-display mt-4 text-3xl">Shukriya, {v.name.split(" ")[0]}!</h2>
            <p className="mt-2 text-espresso-muted">We&apos;ll get back to you within a few hours.</p>
            <button onClick={() => { setV(EMPTY); setSent(false); }} className="btn-light mt-6">Send another</button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            noValidate
            exit={{ opacity: 0 }}
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await call("/api/contact", { body: { ...v, company: hp } });
              if (ok) setSent(true);
            }}
            className="grid gap-4 sm:grid-cols-2"
          >
            <h2 className="h-display text-3xl sm:col-span-2">Send us a message</h2>
            <Field id="cf-name" label="Your name *" error={fields.name}><input {...errProps("cf-name", fields.name)} className="input" value={v.name} onChange={set("name")} autoComplete="name" /></Field>
            <Field id="cf-phone" label="Phone" error={fields.phone}><input {...errProps("cf-phone", fields.phone)} className="input" value={v.phone} onChange={set("phone")} autoComplete="tel" placeholder="0300 1234567" /></Field>
            <div className="sm:col-span-2"><Field id="cf-email" label="Email *" error={fields.email}><input {...errProps("cf-email", fields.email)} type="email" className="input" value={v.email} onChange={set("email")} autoComplete="email" /></Field></div>
            <div className="sm:col-span-2"><Field id="cf-subject" label="Subject" error={fields.subject}><input {...errProps("cf-subject", fields.subject)} className="input" value={v.subject} onChange={set("subject")} placeholder="Catering, birthday booking, feedback…" /></Field></div>
            <div className="sm:col-span-2"><Field id="cf-message" label="Message *" error={fields.message}><textarea {...errProps("cf-message", fields.message)} rows={5} className="input resize-none" value={v.message} onChange={set("message")} /></Field></div>
            <input tabIndex={-1} aria-hidden="true" autoComplete="off" className="hidden" value={hp} onChange={(e) => setHp(e.target.value)} />
            {error && <p role="alert" className="rounded-2xl bg-blush px-4 py-3 text-sm font-medium text-cherry-600 sm:col-span-2">{error}</p>}
            <div className="sm:col-span-2"><button type="submit" disabled={busy} className="btn-primary w-full sm:w-auto">{busy ? "Sending…" : "Send message"}</button></div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
