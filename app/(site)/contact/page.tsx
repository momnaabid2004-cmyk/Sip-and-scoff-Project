import type { Metadata } from "next";
import { getSiteData } from "@/lib/site-data";
import { ContactForm } from "@/components/sections/contact/ContactForm";
import { MapEmbed } from "@/components/sections/contact/MapEmbed";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { FadeUp } from "@/components/motion/FadeUp";

export const metadata: Metadata = { title: "Visit & contact" };

export default async function ContactPage() {
  const { settings: s } = await getSiteData();
  const wa = `https://wa.me/${s.whatsapp.replace(/\D/g, "")}`;
  const cards = [
    { t: "Call", v: s.phone, href: `tel:${s.phone.replace(/\s/g, "")}`, bg: "#F1DFCB" },
    { t: "WhatsApp", v: s.whatsapp, href: wa, bg: "#D3EDDF" },
    { t: "Email", v: s.email, href: `mailto:${s.email}`, bg: "#FBE3D6" },
    { t: "Visit", v: `${s.address}, ${s.city}`, href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.mapsQuery)}`, bg: "#FCE3A6" },
  ];
  return (
    <>
      <section className="container-site pb-10 pt-12 text-center sm:pt-16">
        <p className="eyebrow">We&apos;d love to see you</p>
        <SplitReveal as="h1" by="chars" trigger="load" className="h-display mt-4 text-[clamp(3.4rem,12vw,8rem)] leading-[0.9]">Say <em className="text-cherry-600">salam</em></SplitReveal>
        <FadeUp delay={0.3}><p className="mx-auto mt-5 max-w-lg font-light text-espresso-muted">Bookings, birthday cakes, catering or feedback — message us or drop by.</p></FadeUp>
      </section>
      <section className="container-site grid gap-6 pb-24 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {cards.map((c, i) => (
              <FadeUp key={c.t} delay={i * 0.06}>
                <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="focus-ring group flex h-full flex-col items-center gap-1 rounded-[24px] p-5 text-center transition-transform duration-500 ease-expo hover:-translate-y-1 sm:items-start sm:text-left" style={{ background: c.bg }}>
                  <span className="text-[11px] uppercase tracking-[0.24em] text-espresso/70">{c.t}</span>
                  <span className="font-display text-xl leading-snug">{c.v}</span>
                </a>
              </FadeUp>
            ))}
          </div>
          <FadeUp>
            <div className="rounded-[24px] bg-white p-5 text-center sm:text-left">
              <p className="text-[11px] uppercase tracking-[0.24em] text-espresso-muted">Hours</p>
              <ul className="mt-2 space-y-1 font-display text-xl">{s.hours.map((h) => <li key={h.days}>{h.days} · {h.time}</li>)}</ul>
            </div>
          </FadeUp>
          <FadeUp><MapEmbed query={s.mapsQuery} label={`${s.address}, ${s.city}`} /></FadeUp>
        </div>
        <FadeUp delay={0.1}><ContactForm /></FadeUp>
      </section>
    </>
  );
}
