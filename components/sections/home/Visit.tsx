import Link from "next/link";
import type { Settings } from "@/lib/db/types";
import { formatPKR } from "@/lib/pricing";
import { FadeUp } from "@/components/motion/FadeUp";

export function Visit({ settings: s }: { settings: Settings }) {
  const cols = [
    { h: "Hours", body: s.hours.map((x) => `${x.days} · ${x.time}`), action: null },
    { h: "Find us", body: [s.address, s.city], action: <Link href="/contact" className="mt-4 inline-block text-sm uppercase tracking-[0.18em] text-cherry-600 underline-offset-4 hover:underline">Get directions →</Link> },
    { h: "Delivery", body: [`${formatPKR(s.deliveryFee)} · free over ${formatPKR(s.freeDeliveryOver)}`, s.deliveryAreas.slice(0, 6).join(" · ")], action: null },
  ];
  return (
    <section id="visit" className="container-site pb-20 sm:pb-28" aria-label="Visit and delivery">
      <div className="grid border-y border-espresso/15 md:grid-cols-3">
        {cols.map((c, i) => (
          <FadeUp key={c.h} delay={i * 0.1} className={`px-2 py-10 text-center md:text-left ${i < 2 ? "border-b border-espresso/15 md:border-b-0 md:border-r" : ""} md:px-8 md:first:pl-0`}>
            <h2 className="eyebrow">{c.h}</h2>
            <p className="h-display mt-4 text-2xl leading-snug sm:text-[28px]">{c.body[0]}</p>
            {c.body.slice(1).map((b) => <p key={b} className="mt-2 text-[15px] font-light text-espresso-muted">{b}</p>)}
            {c.action}
          </FadeUp>
        ))}
      </div>
    </section>
  );
}
