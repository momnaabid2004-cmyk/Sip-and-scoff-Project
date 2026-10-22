"use client";
import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";

/**
 * Number that counts up the first time it scrolls into view. The real value is in the server HTML,
 * and numbers already on screen when the page opens are shown as-is (no "0" flash on load).
 */
export function CountUp({ to, prefix = "", suffix = "", duration = 1.6, className }: { to: number; prefix?: string; suffix?: string; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [v, setV] = useState(to);
  const skip = useRef<boolean | null>(null);
  useEffect(() => {
    // decided once, at mount: visible already → keep the final value
    if (skip.current === null) {
      const r = ref.current?.getBoundingClientRect();
      skip.current = !r || r.top < window.innerHeight;
    }
  }, []);
  useEffect(() => {
    if (!inView || skip.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setV(to);
    const c = animate(0, to, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: (n) => setV(Math.round(n)) });
    return () => c.stop();
  }, [inView, to, duration]);
  return (
    <span ref={ref} className={className}>
      {prefix}
      {v.toLocaleString("en-PK")}
      {suffix}
    </span>
  );
}
