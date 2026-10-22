"use client";
import { useRef, type ElementType, type ReactNode } from "react";
import { clsx } from "clsx";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useReducedMotion";

type Props = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  id?: string;
  /** chars = letter-by-letter (hero), words = word rise, lines = masked line reveal (section titles) */
  by?: "chars" | "words" | "lines";
  trigger?: "load" | "scroll";
  delay?: number;
  stagger?: number;
  "aria-hidden"?: boolean | "true";
};

/**
 * Masked text reveal powered by GSAP SplitText. Text stays real & selectable; screen readers read it normally.
 * Speed first: text is visible in the server HTML. `trigger="load"` headings (above the fold) are never hidden —
 * they show instantly. `trigger="scroll"` headings animate quickly just before they enter the screen.
 */
export function SplitReveal({ children, as: Tag = "h2", className, id, by = "lines", trigger = "scroll", delay = 0, stagger, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (prefersReducedMotion() || trigger === "load") return;
      const split = SplitText.create(el, { type: by === "lines" ? "lines" : `lines,${by}`, mask: "lines", linesClass: "split-line", aria: "auto" });
      const targets = by === "chars" ? split.chars : by === "words" ? split.words : split.lines;
      gsap.from(targets, {
        yPercent: 110,
        rotate: by === "lines" ? 0 : 6,
        opacity: by === "lines" ? 1 : 0,
        duration: by === "chars" ? 0.55 : 0.7,
        ease: "expo.out",
        stagger: stagger ?? (by === "chars" ? 0.015 : by === "words" ? 0.035 : 0.07),
        delay: Math.min(delay, 0.15),
        scrollTrigger: { trigger: el, start: "top 95%", once: true },
      });
      return () => split.revert();
    },
    { scope: ref }
  );
  return (
    <Tag ref={ref} id={id} data-split="" className={clsx(className)} {...rest}>
      {children}
    </Tag>
  );
}
