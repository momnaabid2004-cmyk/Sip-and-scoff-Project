"use client";
import Link from "next/link";
import { useRef } from "react";
import type { Feature } from "@/lib/db/types";
import { Food3D } from "@/components/three/Food3D";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { FadeUp } from "@/components/motion/FadeUp";
import { FeatureIcon } from "@/components/ui/FeatureIcon";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useReducedMotion";

/** Story + features. The three illustrated tiles drift at different speeds (parallax). */
export function Story({ features, cafeName }: { features: Feature[]; cafeName: string }) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.utils.toArray<HTMLElement>("[data-depth]").forEach((el) => {
        gsap.fromTo(el, { yPercent: Number(el.dataset.depth) * 12 }, { yPercent: Number(el.dataset.depth) * -12, ease: "none", scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: true } });
      });
    },
    { scope: ref }
  );

  return (
    <section ref={ref} id="story" className="container-site grid items-center gap-14 py-20 sm:py-28 lg:grid-cols-2 lg:gap-20" aria-labelledby="story-title">
      <div className="relative mx-auto aspect-square w-full max-w-[520px]" aria-hidden="true">
        <div data-depth="1" className="absolute left-0 top-0 h-[62%] w-[58%] rounded-[28px] bg-latte-light "><Food3D kind="cup" tint="#B9814F" /></div>
        <div data-depth="2.2" className="absolute right-0 top-[12%] h-[48%] w-[40%] rounded-arch bg-blush "><Food3D kind="cone" tint="#F4B3BE" /></div>
        <div data-depth="1.6" className="absolute bottom-0 left-[22%] h-[44%] w-[52%] rounded-[28px] bg-butter "><Food3D kind="samosa" tint="#E8A24A" /></div>
        <p className="hand absolute -bottom-2 right-0 z-[25] rotate-[-4deg] text-3xl">made with love, daily</p>
      </div>
      <div className="text-center lg:text-left">
        <FadeUp y={12}><p className="eyebrow">Our story</p></FadeUp>
        <SplitReveal id="story-title" className="h-display mt-4 text-[clamp(2.4rem,5.5vw,4.4rem)]">One table for <em className="text-cherry-600">every craving</em></SplitReveal>
        <FadeUp delay={0.1}>
          <p className="mx-auto mt-6 max-w-xl text-[17px] font-light leading-relaxed text-espresso-muted lg:mx-0">
            {cafeName} began with a simple idea: one place where your father gets his karak chai, you get a Spanish latte and your little sister gets a brownie sundae — and nobody compromises.
          </p>
        </FadeUp>
        <ul className="mx-auto mt-10 grid max-w-xl gap-x-8 text-left sm:grid-cols-2 lg:mx-0">
          {features.slice(0, 6).map((f, i) => (
            <FadeUp key={f.id} delay={0.05 * i}>
              <li className="flex items-center gap-4 border-t border-espresso/12 py-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-latte-light text-latte-600"><FeatureIcon icon={f.icon} className="h-5 w-5" /></span>
                <span>
                  <span className="block text-[15px]">{f.title}</span>
                  <span className="block text-[13px] font-light text-espresso-muted">{f.description}</span>
                </span>
              </li>
            </FadeUp>
          ))}
        </ul>
        <FadeUp delay={0.2}><Link href="/about" className="btn-light mt-10">Read our story</Link></FadeUp>
      </div>
    </section>
  );
}
