"use client";
import { useRef } from "react";
import type { Product } from "@/lib/db/types";
import { ProductImage } from "@/components/art/ProductImage";
import { SectionHead } from "@/components/ui/SectionHead";
import { useUI } from "@/components/providers/UIProvider";
import { formatPKR } from "@/lib/pricing";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useReducedMotion";
import { PlusIcon } from "@/components/ui/Icons";

export type Slot = { time: string; title: string; text: string; bg: string; product: Product | undefined };

/** "Morning chai → midnight scoops": pinned horizontal scroll on desktop; on phones & tablets the cards stack vertically, one per row. */
export function DayTimeline({ slots }: { slots: Slot[] }) {
  const ref = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const { openProduct } = useUI();

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px)", () => {
        const el = track.current!;
        const dist = () => Math.max(0, el.scrollWidth - el.clientWidth);
        gsap.to(el.firstElementChild, { x: () => -dist(), ease: "none", scrollTrigger: { trigger: ref.current, start: "top top", end: () => `+=${dist()}`, scrub: 1, pin: true, invalidateOnRefresh: true } });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <section ref={ref} className="overflow-hidden bg-latte-light py-20 sm:py-28 lg:flex lg:h-[100svh] lg:flex-col lg:justify-center lg:py-0" aria-labelledby="day-title">
      <div className="container-site">
        <SectionHead id="day-title" eyebrow="A day at Sip & Scoop" title={<>Morning chai to <em className="text-cherry-600">midnight scoops</em></>} />
      </div>
      <div ref={track} className="mt-12 lg:overflow-visible">
        <div className="container-site grid grid-cols-1 gap-4 sm:grid-cols-2 lg:flex lg:w-max lg:max-w-none lg:gap-6 lg:px-10 xl:px-[max(2.5rem,calc((100vw-1320px)/2+2.5rem))]">
          {slots.map((s) => (
            <article key={s.time} className="flex w-full flex-col rounded-[28px] bg-vanilla p-6 sm:p-7 lg:w-[360px] lg:shrink-0">
              <span className="h-display text-6xl text-cherry-600">{s.time}</span>
              <h3 className="mt-3 text-sm uppercase tracking-[0.22em]">{s.title}</h3>
              <p className="mt-2 font-light leading-relaxed text-espresso-muted">{s.text}</p>
              {s.product && (
                <button onClick={() => openProduct(s.product!)} className="focus-ring group mt-6 flex items-center gap-4 rounded-2xl p-2 text-left transition-colors hover:bg-white" style={{ background: s.bg }}>
                  <ProductImage product={s.product} three className="h-24 w-24 shrink-0 rounded-xl" sizes="96px" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] uppercase tracking-[0.2em] text-espresso/70">Try</span>
                    <span className="block truncate font-display text-xl">{s.product.name}</span>
                    <span className="block text-sm">{formatPKR(s.product.price)}</span>
                  </span>
                  <span className="mr-2 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cherry-600 text-white transition-transform group-hover:rotate-90"><PlusIcon width={16} /></span>
                </button>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
