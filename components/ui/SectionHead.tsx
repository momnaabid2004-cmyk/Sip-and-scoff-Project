import type { ReactNode } from "react";
import { clsx } from "clsx";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { FadeUp } from "@/components/motion/FadeUp";

/** Eyebrow + masked-reveal serif title (+ optional action). Centred on phones, left from md. */
export function SectionHead({ eyebrow, title, id, action, center, light, className }: { eyebrow: string; title: ReactNode; id?: string; action?: ReactNode; center?: boolean; light?: boolean; className?: string }) {
  return (
    <div className={clsx("flex flex-col items-center gap-6 text-center", !center && "md:flex-row md:items-end md:justify-between md:text-left", className)}>
      <div className={clsx(center && "mx-auto")}>
        <FadeUp y={12}><p className={clsx("eyebrow", light && "!text-saffron")}>{eyebrow}</p></FadeUp>
        <SplitReveal id={id} className={clsx("h-display mt-4 text-[clamp(2.4rem,6vw,4.8rem)]", light && "text-vanilla")}>{title}</SplitReveal>
      </div>
      {action && <FadeUp delay={0.2}>{action}</FadeUp>}
    </div>
  );
}
