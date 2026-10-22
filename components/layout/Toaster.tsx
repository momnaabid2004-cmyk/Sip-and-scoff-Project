"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useUI } from "@/components/providers/UIProvider";

export function Toaster() {
  const { toasts, dismiss, setCartOpen } = useUI();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[90] flex flex-col items-center gap-2 px-4 sm:bottom-8" role="status" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div key={t.id} layout initial={{ opacity: 0, y: 24, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16 }} transition={{ type: "spring", stiffness: 380, damping: 30 }} className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-full bg-espresso py-2 pl-5 pr-2 text-vanilla shadow-card">
            <span className="h-2 w-2 shrink-0 rounded-full bg-mint" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{t.title}</p>
              {t.desc && <p className="truncate text-xs text-latte-light/80">{t.desc}</p>}
            </div>
            <button onClick={() => { dismiss(t.id); setCartOpen(true); }} className="focus-ring min-h-[40px] rounded-full bg-saffron px-4 text-xs uppercase tracking-[0.14em] text-espresso">View cart</button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
