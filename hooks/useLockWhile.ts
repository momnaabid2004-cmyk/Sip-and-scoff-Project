"use client";
import { useEffect } from "react";
import { useLenis } from "@/components/providers/SmoothScroll";

/** Lock page scroll and close on Escape while an overlay is open. */
export function useLockWhile(open: boolean, onClose: () => void) {
  const { lock, unlock } = useLenis();
  useEffect(() => {
    if (!open) return;
    lock();
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => {
      unlock();
      window.removeEventListener("keydown", k);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}
