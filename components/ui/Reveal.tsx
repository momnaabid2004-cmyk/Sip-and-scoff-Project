"use client";
import { useRef, type ReactNode, type ElementType } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useReducedMotion";

type Props = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Animate direct children one after another instead of the wrapper. */
  stagger?: number;
  y?: number;
  delay?: number;
  start?: string;
  id?: string;
};

/** Generic scroll-triggered fade-up (GSAP ScrollTrigger). */
export function Reveal({ children, as: Tag = "div", className, stagger, y = 40, delay = 0, start = "top 85%", id }: Props) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion()) return;
      const targets = stagger ? Array.from(ref.current.children) : ref.current;
      gsap.from(targets, {
        y,
        opacity: 0,
        duration: 1,
        delay,
        ease: "power3.out",
        stagger: stagger ?? 0,
        scrollTrigger: { trigger: ref.current, start, once: true },
      });
      ScrollTrigger.refresh();
    },
    { scope: ref }
  );
  return (
    <Tag ref={ref} className={className} id={id}>
      {children}
    </Tag>
  );
}
