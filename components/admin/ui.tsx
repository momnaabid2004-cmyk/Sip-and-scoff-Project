"use client";
import { AnimatePresence, motion } from "framer-motion";
import { clsx } from "clsx";
import type { ReactNode } from "react";
import { CloseIcon } from "@/components/ui/Icons";

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="h-display text-3xl sm:text-4xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-cocoa-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("rounded-3xl border border-cocoa/10 bg-white", className)}>{children}</div>;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={clsx("focus-ring relative h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-pista-600" : "bg-cocoa/20")}>
      <span className={clsx("absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-[22px]" : "translate-x-0.5")} />
    </button>
  );
}

/** Slide-over panel used for create / edit forms. */
export function Drawer({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="d-bg" className="fixed inset-0 z-[60] bg-cocoa/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside key="d" role="dialog" aria-modal="true" aria-label={title} initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 34 }} className="fixed bottom-0 right-0 top-0 z-[61] flex w-full max-w-xl flex-col bg-[#FBF6EF]">
            <div className="flex items-center justify-between border-b border-cocoa/10 px-6 py-4">
              <h2 className="font-display text-xl font-extrabold">{title}</h2>
              <button onClick={onClose} className="focus-ring grid h-9 w-9 place-items-center rounded-full hover:bg-cocoa/5" aria-label="Close"><CloseIcon width={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
            {footer && <div className="border-t border-cocoa/10 px-6 py-4">{footer}</div>}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="p-10 text-center text-sm text-cocoa-muted">{children}</p>;
}

export { badge } from "./badge";
