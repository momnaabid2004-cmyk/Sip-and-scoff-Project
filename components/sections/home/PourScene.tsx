"use client";
import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useReducedMotion";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { Food3D } from "@/components/three/Food3D";

const STEPS = [
  { n: "01", t: "Sourced in small lots", d: "Arabica from single estates, never shelved past two weeks." },
  { n: "02", t: "Roasted twice a week", d: "Medium-dark, for a crema that holds latte art." },
  { n: "03", t: "Poured to order", d: "Every cup, every time — no batch brewing, ever." },
];

/**
 * "Bean to cup" — pinned & scroll-scrubbed on desktop (GSAP ScrollTrigger):
 * a realistic 3D espresso pour: twin streams open, the cup fills, latte art blooms, steam rises,
 * the steps light up one by one and the background words slide past each other.
 * Tablets & phones get the same scroll-linked pour without pinning.
 */
export function PourScene() {
  const ref = useRef<HTMLElement>(null);
  const progress = useRef(0); // read every frame by the 3D pour

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        progress.current = 1;
        return;
      }
      const mm = gsap.matchMedia();
      mm.add("(max-width: 1023px)", () => {
        // phones & tablets: no pinning — the pour plays as the section scrolls through the screen
        const st = ScrollTrigger.create({ trigger: ref.current, start: "top 75%", end: "bottom 60%", scrub: true, onUpdate: (self) => (progress.current = self.progress) });
        return () => st.kill();
      });
      mm.add("(min-width: 1024px)", () => {
        const tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: ref.current, start: "top top", end: "+=180%", scrub: 1, pin: true, anticipatePin: 1, onUpdate: (self) => (progress.current = self.progress) } });
        tl.fromTo("[data-word-a]", { xPercent: 10 }, { xPercent: -25, duration: 1 }, 0)
          .fromTo("[data-word-b]", { xPercent: -25 }, { xPercent: 10, duration: 1 }, 0)
          .fromTo("[data-progress]", { scaleY: 0 }, { scaleY: 1, duration: 1 }, 0);
        gsap.utils.toArray<HTMLElement>("[data-step]").forEach((el, i) => {
          tl.fromTo(el, { opacity: 0.28, x: -12 }, { opacity: 1, x: 0, duration: 0.12 }, 0.08 + i * 0.3);
        });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <section ref={ref} className="relative overflow-hidden bg-espresso text-vanilla lg:flex lg:h-[100svh] lg:items-center" aria-labelledby="pour-title">
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-2 font-display leading-[0.85] text-saffron/10" aria-hidden="true">
        <p data-word-a className="whitespace-nowrap text-[26vw] lg:text-[18vw]">Good coffee</p>
        <p data-word-b className="whitespace-nowrap pl-[20vw] text-[26vw] italic lg:text-[18vw]">slow days</p>
      </div>

      <div className="container-site relative grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-[1fr_auto_1fr] lg:gap-10 lg:py-0">
        <div className="text-center lg:text-left">
          <p className="eyebrow !text-saffron">Poured, not rushed</p>
          <SplitReveal id="pour-title" className="h-display mt-4 text-[clamp(2.6rem,5.5vw,4.6rem)]">From bean <em className="text-saffron">to cup</em></SplitReveal>
          <ol className="mx-auto mt-10 max-w-md space-y-7 text-left lg:mx-0">
            {STEPS.map((s) => (
              <li key={s.n} data-step className="flex gap-5">
                <span className="h-display text-3xl text-saffron">{s.n}</span>
                <span>
                  <span className="block text-lg">{s.t}</span>
                  <span className="mt-1 block text-[15px] font-light leading-relaxed text-latte-light/75">{s.d}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* realistic 3D espresso pour — scrubbed by scroll */}
        <div className="relative mx-auto aspect-[4/5] w-[300px] sm:w-[340px] lg:w-[380px]">
          <Food3D kind="cup" tint="#8A5A3C" progress={progress} margin={300} label="3D espresso pouring into a cup" />
        </div>

        <div className="flex flex-col items-center gap-6 text-center lg:items-end lg:text-right">
          <blockquote className="max-w-sm font-display text-3xl italic leading-snug sm:text-4xl">“Great coffee doesn&apos;t just wake you up — it gets people talking.”</blockquote>
          <p className="text-[11px] uppercase tracking-[0.3em] text-saffron">— The Sip &amp; Scoop baristas</p>
          <div className="hidden items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-latte-light/60 lg:flex" aria-hidden="true">
            Scroll
            <span className="relative block h-28 w-0.5 overflow-hidden rounded bg-latte-light/15"><span data-progress className="absolute inset-0 origin-top bg-saffron" /></span>
          </div>
        </div>
      </div>
    </section>
  );
}
