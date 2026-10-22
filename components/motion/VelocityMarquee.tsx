"use client";
import { useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useReducedMotion";

/** Infinite marquee that speeds up and skews with scroll velocity (GSAP). */
export function VelocityMarquee({ children, className, speed = 40 }: { children: ReactNode; className?: string; speed?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const track = ref.current?.querySelector<HTMLElement>("[data-track]");
      if (!track || prefersReducedMotion()) return;
      const loop = gsap.to(track, { xPercent: -50, ease: "none", duration: speed, repeat: -1 });
      const skew = gsap.quickTo(track, "skewX", { duration: 0.5, ease: "power3" });
      const st = ScrollTrigger.create({
        onUpdate: (self) => {
          const v = self.getVelocity();
          loop.timeScale(1 + Math.min(Math.abs(v) / 400, 4));
          skew(gsap.utils.clamp(-8, 8, v / -300));
          gsap.to(loop, { timeScale: 1, duration: 1.2, overwrite: true, delay: 0.1 });
        },
      });
      return () => st.kill();
    },
    { scope: ref }
  );
  return (
    <div ref={ref} className={className} aria-hidden="true">
      <div data-track className="flex w-max will-change-transform">
        <div className="flex shrink-0">{children}</div>
        <div className="flex shrink-0">{children}</div>
      </div>
    </div>
  );
}
