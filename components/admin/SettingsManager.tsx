"use client";
import { useState } from "react";
import type { Settings } from "@/lib/db/types";
import { useApi } from "@/hooks/useApi";
import { Field, errProps } from "@/components/ui/Field";
import { TrashIcon } from "@/components/ui/Icons";
import { PageHeader, Panel } from "./ui";

/** Café details, delivery rules and the AI assistant's personality + knowledge. */
export function SettingsManager({ initial, ai, emailOn }: { initial: Settings; ai: { provider: string; model: string; enabled: boolean; keyVar: string }; emailOn: boolean }) {
  const [s, setS] = useState(initial);
  const [saved, setSaved] = useState(false);
  const api = useApi();
  const f = api.fields;
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => { setS({ ...s, [k]: v }); setSaved(false); };
  const text = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, e.target.value as never);

  const save = async () => {
    const res = await api.call<Settings>("/api/admin/settings", { method: "PUT", body: s });
    if (res) { setS(res); setSaved(true); }
  };

  const Section = ({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) => (
    <Panel className="p-5 sm:p-6">
      <h2 className="font-display text-xl font-extrabold">{title}</h2>
      {sub && <p className="mt-1 text-sm text-cocoa-muted">{sub}</p>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </Panel>
  );

  return (
    <>
      <PageHeader title="Settings & AI" sub="Everything here updates the website and the AI assistant instantly." action={
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm font-bold text-pista-600" role="status">✓ Saved</span>}
          <button onClick={save} disabled={api.busy} className="btn-primary !py-2.5">{api.busy ? "Saving…" : "Save settings"}</button>
        </div>
      } />
      {api.error && <p role="alert" className="mb-4 rounded-2xl bg-berry-light px-4 py-3 text-sm font-bold text-berry-600">{api.error}</p>}
      <div className="space-y-6">
        {Section({
          title: "Café details",
          children: (
            <>
              <Field id="s-name" label="Café name" error={f.cafeName}><input {...errProps("s-name", f.cafeName)} className="input" value={s.cafeName} onChange={text("cafeName")} /></Field>
              <Field id="s-email" label="Email" error={f.email}><input {...errProps("s-email", f.email)} className="input" value={s.email} onChange={text("email")} /></Field>
              <div className="sm:col-span-2"><Field id="s-ann" label="Announcement bar" hint="Shown at the top of every page — leave empty to hide" error={f.announcement}><input {...errProps("s-ann", f.announcement)} className="input" value={s.announcement ?? ""} onChange={text("announcement")} placeholder="Today's deal · …" /></Field></div>
              <div className="sm:col-span-2"><Field id="s-tag" label="Tagline" error={f.tagline}><input {...errProps("s-tag", f.tagline)} className="input" value={s.tagline} onChange={text("tagline")} /></Field></div>
              <Field id="s-phone" label="Phone" error={f.phone}><input {...errProps("s-phone", f.phone)} className="input" value={s.phone} onChange={text("phone")} /></Field>
              <Field id="s-wa" label="WhatsApp" error={f.whatsapp}><input {...errProps("s-wa", f.whatsapp)} className="input" value={s.whatsapp} onChange={text("whatsapp")} /></Field>
              <Field id="s-addr" label="Address" error={f.address}><input {...errProps("s-addr", f.address)} className="input" value={s.address} onChange={text("address")} /></Field>
              <Field id="s-city" label="City" error={f.city}><input {...errProps("s-city", f.city)} className="input" value={s.city} onChange={text("city")} /></Field>
              <div className="sm:col-span-2"><Field id="s-map" label="Google Maps search text" hint="What to search on Google Maps for the map & directions" error={f.mapsQuery}><input {...errProps("s-map", f.mapsQuery)} className="input" value={s.mapsQuery} onChange={text("mapsQuery")} /></Field></div>
            </>
          ),
        })}

        {Section({
          title: "Opening hours",
          children: (
            <div className="space-y-2 sm:col-span-2">
              {s.hours.map((h, i) => (
                <div key={i} className="flex gap-2">
                  <input aria-label="Days" className="input" value={h.days} onChange={(e) => set("hours", s.hours.map((x, j) => (j === i ? { ...x, days: e.target.value } : x)))} />
                  <input aria-label="Time" className="input" value={h.time} onChange={(e) => set("hours", s.hours.map((x, j) => (j === i ? { ...x, time: e.target.value } : x)))} />
                  <button type="button" disabled={s.hours.length < 2} onClick={() => set("hours", s.hours.filter((_, j) => j !== i))} className="btn-ghost !px-3 disabled:opacity-30" aria-label="Remove row"><TrashIcon width={16} /></button>
                </div>
              ))}
              {s.hours.length < 7 && <button type="button" onClick={() => set("hours", [...s.hours, { days: "", time: "" }])} className="text-sm font-bold text-berry-600">+ Add row</button>}
            </div>
          ),
        })}

        {Section({
          title: "Delivery",
          children: (
            <>
              <Field id="s-fee" label="Delivery fee (Rs)" error={f.deliveryFee}><input {...errProps("s-fee", f.deliveryFee)} type="number" className="input" value={s.deliveryFee} onChange={(e) => set("deliveryFee", Number(e.target.value))} /></Field>
              <Field id="s-free" label="Free delivery over (Rs)" error={f.freeDeliveryOver}><input {...errProps("s-free", f.freeDeliveryOver)} type="number" className="input" value={s.freeDeliveryOver} onChange={(e) => set("freeDeliveryOver", Number(e.target.value))} /></Field>
              <Field id="s-dt" label="Delivery time" error={f.deliveryTime}><input {...errProps("s-dt", f.deliveryTime)} className="input" value={s.deliveryTime} onChange={text("deliveryTime")} /></Field>
              <Field id="s-areas" label="Delivery areas" hint="Comma separated"><input id="s-areas" className="input" value={s.deliveryAreas.join(", ")} onChange={(e) => set("deliveryAreas", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} /></Field>
            </>
          ),
        })}

        {Section({
          title: "Social links",
          children: (
            <>
              <Field id="s-ig" label="Instagram"><input id="s-ig" className="input" value={s.socials.instagram} onChange={(e) => set("socials", { ...s.socials, instagram: e.target.value })} /></Field>
              <Field id="s-fb" label="Facebook"><input id="s-fb" className="input" value={s.socials.facebook} onChange={(e) => set("socials", { ...s.socials, facebook: e.target.value })} /></Field>
              <Field id="s-tt" label="TikTok"><input id="s-tt" className="input" value={s.socials.tiktok} onChange={(e) => set("socials", { ...s.socials, tiktok: e.target.value })} /></Field>
            </>
          ),
        })}

        {Section({
          title: "AI assistant",
          sub: ai.enabled
            ? `Running on ${ai.provider} (${ai.model}). It reads your live menu, prices, hours, delivery rules and the notes below — changes apply to the next message.`
            : `Running the free built-in assistant. Add ${ai.keyVar} to your environment variables to switch on the AI — no other changes needed.`,
          children: (
            <>
              <Field id="s-ai" label="Assistant name" error={f.aiName}><input {...errProps("s-ai", f.aiName)} className="input" value={s.aiName} onChange={text("aiName")} /></Field>
              <div className="sm:col-span-2"><Field id="s-greet" label="Greeting message" error={f.aiGreeting}><textarea {...errProps("s-greet", f.aiGreeting)} rows={2} className="input resize-none" value={s.aiGreeting} onChange={text("aiGreeting")} /></Field></div>
              <div className="sm:col-span-2">
                <Field id="s-know" label="Knowledge base — facts & policies the assistant must know" hint="One fact per line: deals, refund policy, allergens, catering, cakes, parking… The starting text is SAMPLE content — replace it with the café's real policies before launch." error={f.aiKnowledge}>
                  <textarea {...errProps("s-know", f.aiKnowledge)} rows={10} className="input font-mono text-xs" value={s.aiKnowledge} onChange={text("aiKnowledge")} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field id="s-start" label="Suggested questions (chips in the chat)" hint="Comma separated, up to 6 — e.g. What's popular?, Delivery charges?, Track my order" error={f.aiStarters}>
                  <input id="s-start" className="input" value={(s.aiStarters ?? []).join(", ")} onChange={(e) => set("aiStarters", e.target.value.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 6))} />
                </Field>
              </div>
              <p className="text-xs text-cocoa-muted sm:col-span-2">Email alerts for new orders, messages and requests: <b>{emailOn ? "on" : "off — set RESEND_API_KEY, EMAIL_FROM and ALERT_EMAILS"}</b>.</p>
            </>
          ),
        })}
      </div>
    </>
  );
}
