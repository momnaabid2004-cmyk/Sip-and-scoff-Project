"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { clsx } from "clsx";
import { Logo } from "@/components/art/Logo";
import { useCart } from "@/components/providers/CartProvider";
import { useUI } from "@/components/providers/UIProvider";
import { useSite } from "@/components/providers/SiteProvider";
import { useLenis } from "@/components/providers/SmoothScroll";
import { AnnouncementBar } from "./AnnouncementBar";
import { BagIcon, CloseIcon } from "@/components/ui/Icons";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/about", label: "Our story" },
  { href: "/contact", label: "Visit" },
];

/** Sticky header: hides on scroll down, returns on scroll up; turns into a frosted bar once scrolled. */
export function Navbar() {
  const pathname = usePathname();
  const { count, subtotal } = useCart();
  const { setCartOpen } = useUI();
  const { settings } = useSite();
  const { lock, unlock } = useLenis();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  // keep the header pinned on pages with their own sticky toolbar
  const autoHide = !pathname.startsWith("/menu") && !pathname.startsWith("/checkout");
  useEffect(() => {
    let last = window.scrollY;
    const f = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setHidden(autoHide && y > 400 && y > last + 4);
      if (y < last - 4) setHidden(false);
      last = y;
    };
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, [autoHide]);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    lock();
    return () => unlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const active = (h: string) => (h === "/" ? pathname === "/" : pathname.startsWith(h));

  return (
    <>
      <AnnouncementBar />
      <header className={clsx("sticky top-0 z-50 transition-[transform,background-color,box-shadow] duration-500 ease-expo", hidden && !open ? "-translate-y-full" : "translate-y-0", scrolled || open ? "bg-vanilla shadow-[0_1px_0_rgba(42,24,16,0.08)]" : "bg-vanilla")}>
        <nav aria-label="Main" className="container-site flex h-[68px] items-center justify-between gap-4 lg:h-[80px]">
          <Link href="/" className="focus-ring rounded" aria-label={`${settings.cafeName} — home`}>
            <Logo name={settings.cafeName} />
          </Link>
          <ul className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} aria-current={active(l.href) ? "page" : undefined} className="focus-ring group relative rounded-full px-4 py-2 text-[15px] text-espresso">
                  {l.label}
                  <span className={clsx("absolute inset-x-4 -bottom-0.5 h-px origin-left bg-espresso transition-transform duration-500 ease-expo", active(l.href) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100")} />
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <button onClick={() => setCartOpen(true)} className="focus-ring relative flex h-11 items-center gap-2 rounded-full border border-espresso/20 pl-3 pr-3 text-espresso transition-colors hover:border-espresso sm:pr-4" aria-label={`Open cart, ${count} items`}>
              <motion.span key={count} initial={count ? { scale: 1.4, rotate: -14 } : false} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 500, damping: 12 }} className="grid">
                <BagIcon width={19} />
              </motion.span>
              <span className="hidden text-sm tabular-nums sm:inline">{count > 0 ? `Rs ${subtotal.toLocaleString("en-PK")}` : "Cart"}</span>
              {count > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-cherry-600 px-1 text-[10px] font-medium text-white">{count}</span>}
            </button>
            <Link href="/menu" className="btn-primary hidden !min-h-[44px] !px-6 sm:inline-flex">Order now</Link>
            <button onClick={() => setOpen((v) => !v)} className="focus-ring grid h-11 w-11 place-items-center rounded-full bg-espresso text-vanilla md:hidden" aria-label="Toggle menu" aria-expanded={open} aria-controls="mobile-menu">
              {open ? <CloseIcon width={18} /> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 8h16M4 16h16" /></svg>}
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-40 flex flex-col justify-center bg-vanilla px-6 pt-20 text-center md:hidden"
          >
            <ul className="space-y-2">
              {LINKS.map((l, i) => (
                <li key={l.href} className="overflow-hidden">
                  <motion.span className="block" initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ delay: 0.15 + i * 0.07, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
                    <Link href={l.href} className={clsx("h-display block py-2 text-5xl", active(l.href) ? "italic text-cherry-600" : "text-espresso")}>
                      {l.label}
                    </Link>
                  </motion.span>
                </li>
              ))}
            </ul>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mx-auto mt-10 flex w-full max-w-xs flex-col gap-3">
              <Link href="/menu" className="btn-primary w-full">Order now</Link>
              <p className="hand text-2xl">open till late, every day</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
