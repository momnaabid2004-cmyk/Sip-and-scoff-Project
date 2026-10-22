"use client";
import { motion } from "framer-motion";
import { clsx } from "clsx";

/** Hand-drawn underline / swash that draws itself when scrolled into view. */
export function DrawLine({ className, color = "#C2364A", delay = 0.4 }: { className?: string; color?: string; delay?: number }) {
  return (
    <svg viewBox="0 0 300 24" preserveAspectRatio="none" className={clsx("pointer-events-none", className)} aria-hidden="true">
      <motion.path
        d="M4 16C60 6 120 4 176 10s90 8 120-2"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, delay, ease: [0.65, 0, 0.35, 1] }}
      />
    </svg>
  );
}
