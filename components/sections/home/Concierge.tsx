"use client";
import { motion } from "framer-motion";
import { useUI } from "@/components/providers/UIProvider";
import { useSite } from "@/components/providers/SiteProvider";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { formatPKR } from "@/lib/pricing";

/** AI concierge pitch — the demo conversation types itself in as it scrolls into view (built from live menu + settings). */
export function Concierge({ picks }: { picks: { name: string; price: number }[] }) {
  const { setChatOpen } = useUI();
  const { settings } = useSite();
  const area = settings.deliveryAreas.find((a) => /dha/i.test(a)) ?? settings.deliveryAreas[0] ?? "";
  const DEMO = [
    { me: true, t: "Kuch thanda chahiye, 500 se kam?" },
    {
      me: false,
      t: picks.length
        ? `${picks[0].name} (${formatPKR(picks[0].price)}) is a favourite${picks[1] ? ` — or a ${picks[1].name} for ${formatPKR(picks[1].price)}` : ""}.`
        : "Let me show you our coolers and shakes — tap the menu for today's prices.",
    },
    ...(area
      ? [
          { me: true, t: `${area} deliver karte ho?` },
          { me: false, t: `Yes! ${formatPKR(settings.deliveryFee)} delivery, free over ${formatPKR(settings.freeDeliveryOver)}, in ${settings.deliveryTime}.` },
        ]
      : []),
  ];
  return (
    <section className="container-site py-16 sm:py-24" aria-labelledby="ai-title">
      <div className="grid items-center gap-10 overflow-hidden rounded-[32px] bg-espresso p-6 text-vanilla sm:p-10 lg:grid-cols-2 lg:gap-16 lg:p-16">
        <div className="text-center lg:text-left">
          <p className="eyebrow !text-saffron">Your café concierge</p>
          <SplitReveal id="ai-title" className="h-display mt-4 text-[clamp(2.3rem,5vw,4.2rem)]">Not sure what to order? <em className="text-saffron">Ask {settings.aiName}.</em></SplitReveal>
          <p className="mx-auto mt-5 max-w-md font-light leading-relaxed text-latte-light/80 lg:mx-0">Prices, pairings, caffeine, delivery areas and timings — {settings.aiName} knows the whole menu and answers in English or Roman Urdu.</p>
          <button onClick={() => setChatOpen(true)} className="btn-saffron mt-8">Start a conversation</button>
        </div>
        <div className="space-y-3 rounded-[24px] bg-vanilla p-4 text-espresso sm:p-6" aria-hidden="true">
          <div className="flex items-center gap-3 border-b border-espresso/10 pb-4">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-cherry-600 font-display text-xl italic text-white">S</span>
            <span><span className="block">{settings.aiName}</span><span className="block text-xs text-espresso-muted">replies instantly</span></span>
          </div>
          {DEMO.map((m, i) => (
            <motion.p key={i} initial={{ opacity: 0, y: 14, scale: 0.96 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.55, duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className={m.me ? "ml-auto w-fit max-w-[82%] rounded-2xl rounded-br-md bg-espresso px-4 py-2.5 text-[15px] text-vanilla" : "w-fit max-w-[88%] rounded-2xl rounded-bl-md bg-latte-light px-4 py-2.5 text-[15px]"}>
              {m.t}
            </motion.p>
          ))}
        </div>
      </div>
    </section>
  );
}
