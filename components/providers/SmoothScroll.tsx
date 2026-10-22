"use client";
import Lenis from "lenis";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useReducedMotion";

type Ctx = {
  lenis: Lenis | null;
  scrollTo: (target: string | number | HTMLElement, offset?: number) => void;
  lock: () => void;
  unlock: () => void;
};

const LenisContext = createContext<Ctx>({ lenis: null, scrollTo: () => {}, lock: () => {}, unlock: () => {} });
export const useLenis = () => useContext(LenisContext);

/** Lenis smooth scroll (snappy), driven by the GSAP ticker so ScrollTrigger stays perfectly in sync. */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const locks = useRef(0);
  const pathname = usePathname();

  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    if (prefersReducedMotion() || isAdmin) return;
    // Snappy smoothing: the page follows the wheel almost instantly (lerp 0.16 ≈ 100 ms settle) instead of
    // gliding for over a second. Touch devices keep fully native scrolling (fastest, no JS in the loop).
    const instance = new Lenis({ lerp: 0.16, wheelMultiplier: 1.05, smoothWheel: true, syncTouch: false });
    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    if (locks.current > 0) instance.stop();
    setLenis(instance);
    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      setLenis(null);
    };
  }, [isAdmin]);

  // New route → jump to top (or hash) and recalc triggers.
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const el = document.querySelector(hash);
      if (el) setTimeout(() => (lenis ? lenis.scrollTo(el as HTMLElement, { offset: -140, immediate: true }) : el.scrollIntoView()), 60);
    } else {
      lenis ? lenis.scrollTo(0, { immediate: true }) : window.scrollTo(0, 0);
    }
    const id = setTimeout(() => ScrollTrigger.refresh(), 120);
    return () => clearTimeout(id);
  }, [pathname, lenis]);

  const value: Ctx = {
    lenis,
    scrollTo: (target, offset = 0) => {
      if (lenis) lenis.scrollTo(target as never, { offset, duration: 0.8 });
      else {
        const el = typeof target === "string" ? document.querySelector(target) : target;
        if (typeof el === "number") window.scrollTo({ top: el + offset });
        else if (el instanceof HTMLElement) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset });
      }
    },
    lock: () => {
      locks.current++;
      lenis?.stop();
      document.documentElement.style.overflow = "hidden";
    },
    unlock: () => {
      locks.current = Math.max(0, locks.current - 1);
      if (locks.current === 0) {
        lenis?.start();
        document.documentElement.style.overflow = "";
      }
    },
  };

  return <LenisContext.Provider value={value}>{children}</LenisContext.Provider>;
}
