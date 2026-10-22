"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Quick in-view rise for blocks (Framer Motion). Starts ~120px before the block enters the screen, so it's ready when seen. */
export function FadeUp({ children, delay = 0, y = 18, className }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px 120px 0px" }} transition={{ duration: 0.45, delay: Math.min(delay, 0.1), ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.div>
  );
}
