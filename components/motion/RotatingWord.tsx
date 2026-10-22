"use client";
import { AnimatePresence, motion } from "framer-motion";
import { clsx } from "clsx";

/** A word that rolls up to the next one (used in the hero: scoops → chai → shakes → snacks). Width animates smoothly. */
export function RotatingWord({ words, index, className }: { words: string[]; index: number; className?: string }) {
  const word = words[index % words.length];
  return (
    <span className={clsx("relative inline-flex overflow-hidden align-bottom", className)} aria-live="polite">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={word}
          layout
          initial={{ y: "100%", opacity: 0, rotate: 4 }}
          animate={{ y: "0%", opacity: 1, rotate: 0 }}
          exit={{ y: "-100%", opacity: 0, rotate: -4 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block whitespace-nowrap pb-[0.08em]"
        >
          {word}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
