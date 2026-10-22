"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ArtKind, Product } from "@/lib/db/types";
import { FoodArt } from "@/components/art/FoodArt";
import { Food3D } from "@/components/three/Food3D";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { RotatingWord } from "@/components/motion/RotatingWord";
import { CountUp } from "@/components/motion/CountUp";
import { Magnetic } from "@/components/motion/Magnetic";
import { useUI } from "@/components/providers/UIProvider";
import { useSite } from "@/components/providers/SiteProvider";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { formatPKR } from "@/lib/pricing";
import { gsap, useGSAP } from "@/lib/gsap";
import { ArrowRight, PlusIcon } from "@/components/ui/Icons";

/** The hero cycles through the menu families: the word, the illustration and the arch colour change together. */
const SLIDES: { word: string; kind: ArtKind; tint: string; bg: string; note: string }[] = [
  { word: "coffee.", kind: "cup", tint: "#B9814F", bg: "#F1DFCB", note: "Pulled to order, latte art on every cup" },
  { word: "scoops.", kind: "cone", tint: "#F4B3BE", bg: "#F8CFCB", note: "Hand-churned in small batches daily" },
  { word: "chai.", kind: "chai-glass", tint: "#C58A55", bg: "#F6E6D2", note: "Boiled the proper Lahori way" },
  { word: "coolers.", kind: "mojito", tint: "#9ED89A", bg: "#D3EDDF", note: "Fresh mint, fizz and crushed ice" },
  { word: "snacks.", kind: "sandwich", tint: "#F2C14E", bg: "#FCE3A6", note: "Toasted, stacked and still crunchy" },
];

export function Hero({ featured, itemCount }: { featured?: Product; itemCount: number }) {
  const [i, setI] = useState(0);
  const reduced = useReducedMotion();
  const { openProduct } = useUI();
  const { settings } = useSite();
  const ref = useRef<HTMLElement>(null);
  const slide = SLIDES[i % SLIDES.length];

  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => setI((n) => n + 1), 3400);
    return () => clearInterval(t);
  }, [reduced]);

  // parallax drift of the arch + floating cards while scrolling away
  useGSAP(
    () => {
      if (reduced) return;
      gsap.to("[data-hero-art]", { yPercent: 10, ease: "none", scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom top", scrub: true } });
      gsap.to("[data-hero-float]", { yPercent: -40, ease: "none", scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom top", scrub: true } });
    },
    { scope: ref, dependencies: [reduced] }
  );

  return (
    <section ref={ref} className="relative overflow-hidden" aria-labelledby="hero-title">
      <div className="container-site grid items-center gap-10 pb-16 pt-8 sm:pt-12 lg:grid-cols-[1.08fr_1fr] lg:gap-14 lg:pb-24 lg:pt-16">
        <div className="relative z-10 text-center lg:text-left">
          <p className="eyebrow">
            Organic café · {settings.city}
          </p>
          <h1 id="hero-title" className="h-display mt-5 whitespace-nowrap text-[clamp(2.9rem,12vw,7rem)] leading-[0.9] lg:text-[clamp(3.4rem,5.6vw,7.4rem)]">
            <SplitReveal as="span" by="chars" trigger="load" delay={0.15} className="block">Slow coffee,</SplitReveal>
            <SplitReveal as="span" by="chars" trigger="load" delay={0.45} className="block">small-batch</SplitReveal>
            <span className="block italic text-cherry-600">
              <RotatingWord words={SLIDES.map((s) => s.word)} index={i} />
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-md text-[17px] font-light leading-relaxed text-espresso-muted sm:text-lg lg:mx-0">
            {settings.tagline}
          </p>
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Magnetic>
              <Link href="/menu" className="btn-primary w-full !min-h-[56px] !px-9 sm:w-auto">
                Order now <ArrowRight width={16} />
              </Link>
            </Magnetic>
            <Link href="/menu" className="btn-light w-full !min-h-[56px] sm:w-auto">Browse the menu</Link>
          </div>
          <p className="hand -rotate-2 mt-5 text-2xl sm:text-[28px]">
            ↳ made fresh, at your door in {settings.deliveryTime.replace("minutes", "min")}
          </p>
          <dl className="mx-auto mt-10 grid max-w-lg grid-cols-3 gap-3 border-t border-espresso/15 pt-6 lg:mx-0">
            <div><dt className="sr-only">Menu items</dt><dd><CountUp to={itemCount} suffix="+" className="h-display block text-3xl sm:text-4xl" /><span className="mt-1 block text-[10px] uppercase tracking-[0.18em] text-espresso-muted sm:text-[11px]">Items, made to order</span></dd></div>
            <div><dt className="sr-only">Delivery</dt><dd><CountUp to={30} suffix=" min" className="h-display block text-3xl sm:text-4xl" /><span className="mt-1 block text-[10px] uppercase tracking-[0.18em] text-espresso-muted sm:text-[11px]">Delivery across {settings.city}</span></dd></div>
            <div><dt className="sr-only">Halal</dt><dd><CountUp to={100} suffix="%" className="h-display block text-3xl sm:text-4xl" /><span className="mt-1 block text-[10px] uppercase tracking-[0.18em] text-espresso-muted sm:text-[11px]">Halal kitchen</span></dd></div>
          </dl>
        </div>

        {/* arch stage */}
        <div className="relative mx-auto w-full max-w-[520px]">
          <div data-hero-art className="relative">
            <motion.div animate={{ backgroundColor: slide.bg }} transition={{ duration: 1, ease: [0.65, 0, 0.35, 1] }} className="relative aspect-[4/5] overflow-hidden rounded-arch">
              {/* realistic 3D model — each slide mounts a fresh model so its intro (pour, scoop drop, stack…) plays */}
              <AnimatePresence mode="wait">
                <motion.div key={slide.kind} className="absolute inset-x-[2%] bottom-[12%] top-[6%]" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
                  <Food3D kind={slide.kind} tint={slide.tint} label={`3D illustration: ${slide.word.replace(".", "")}`} zoom={1.05} margin={400} />
                </motion.div>
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <motion.p key={slide.note} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.5 }} className="absolute inset-x-6 bottom-6 text-center text-xs uppercase tracking-[0.2em] text-espresso/70">
                  {slide.note}
                </motion.p>
              </AnimatePresence>
            </motion.div>
            {/* slide dots */}
            <div className="mt-4 flex justify-center gap-2" role="tablist" aria-label="Featured category">
              {SLIDES.map((s, n) => (
                <button key={s.word} role="tab" aria-selected={n === i % SLIDES.length} aria-label={s.word.replace(".", "")} onClick={() => setI(n)} className="focus-ring grid h-8 w-8 place-items-center rounded-full">
                  <span className={`block h-1.5 rounded-full transition-all duration-500 ${n === i % SLIDES.length ? "w-6 bg-cherry-600" : "w-1.5 bg-espresso/25"}`} />
                </button>
              ))}
            </div>
          </div>

          {/* rotating badge */}
          <div className="absolute -left-3 top-6 z-[25] h-28 w-28 sm:-left-8 sm:h-36 sm:w-36" aria-hidden="true">
            <svg viewBox="0 0 150 150" className="h-full w-full animate-spin-slow">
              <defs><path id="ring" d="M75 75 m-57 0 a57 57 0 1 1 114 0 a57 57 0 1 1 -114 0" /></defs>
              <circle cx="75" cy="75" r="74" fill="#FFF7EE" />
              <text fontSize="11.5" letterSpacing="4.4" fill="#2A1810" style={{ fontFamily: "var(--font-sans)" }}><textPath href="#ring">FRESHLY BREWED · HAND CHURNED · </textPath></text>
            </svg>
            <span className="absolute inset-0 grid place-items-center font-display text-4xl italic text-cherry-600 sm:text-5xl">&amp;</span>
          </div>

          {/* quick-add floating card */}
          {featured && (
            <div data-hero-float className="absolute -right-2 bottom-24 z-[25] sm:-right-8">
              <button onClick={() => openProduct(featured)} className="focus-ring group flex animate-float items-center gap-3 rounded-2xl bg-white p-2.5 pr-3 text-left shadow-card">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-latte-light"><span className="h-10 w-10"><FoodArt kind={featured.art} tint={featured.tint} label="" /></span></span>
                <span>
                  <span className="block text-[10px] uppercase tracking-[0.2em] text-cherry-600">Bestseller</span>
                  <span className="block font-display text-lg leading-tight">{featured.name}</span>
                  <span className="block text-xs text-espresso-muted">{formatPKR(featured.price)}</span>
                </span>
                <span className="ml-1 grid h-9 w-9 place-items-center rounded-full bg-cherry-600 text-white transition-transform group-hover:rotate-90"><PlusIcon width={15} /></span>
              </button>
            </div>
          )}
          <div className="absolute -left-2 bottom-20 z-[25] hidden animate-float-slow rounded-2xl bg-espresso px-4 py-3 text-vanilla sm:block">
            <span className="h-display block text-3xl text-saffron">18h</span>
            <span className="text-xs leading-tight">cold brew,<br />steeped slow</span>
          </div>
        </div>
      </div>
    </section>
  );
}
