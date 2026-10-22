"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useUI } from "@/components/providers/UIProvider";
import { useCart } from "@/components/providers/CartProvider";
import { useSite } from "@/components/providers/SiteProvider";
import { useLockWhile } from "@/hooks/useLockWhile";
import { ProductImage } from "@/components/art/ProductImage";
import { FoodArt } from "@/components/art/FoodArt";
import { formatPKR } from "@/lib/pricing";
import { CloseIcon, MinusIcon, PlusIcon } from "@/components/ui/Icons";

export function CartDrawer() {
  const { cartOpen, setCartOpen } = useUI();
  const { lines, subtotal, count, setQty } = useCart();
  const { settings } = useSite();
  const close = () => setCartOpen(false);
  useLockWhile(cartOpen, close);
  const toFree = Math.max(0, settings.freeDeliveryOver - subtotal);
  const pct = Math.min(100, (subtotal / settings.freeDeliveryOver) * 100);

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div key="cd-bg" className="fixed inset-0 z-[70] bg-espresso/55" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
          <motion.aside key="cd" role="dialog" aria-modal="true" aria-label="Your cart" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 280, damping: 34 }} className="fixed bottom-0 right-0 top-0 z-[71] flex w-full max-w-md flex-col bg-vanilla">
            <div className="flex items-center justify-between border-b border-espresso/10 px-5 py-4 sm:px-6">
              <h2 className="h-display text-3xl">Your cart <span className="font-sans text-base text-espresso-muted">({count})</span></h2>
              <button onClick={close} className="focus-ring grid h-11 w-11 place-items-center rounded-full border border-espresso/20" aria-label="Close cart"><CloseIcon width={18} /></button>
            </div>
            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <div className="h-40 w-40"><FoodArt kind="cup" tint="#C9956B" label="Empty cup" /></div>
                <p className="h-display mt-4 text-3xl">Your cup is empty</p>
                <p className="mt-2 font-light text-espresso-muted">Chai, scoops or a club sandwich — your call.</p>
                <Link href="/menu" onClick={close} className="btn-primary mt-6">Browse the menu</Link>
              </div>
            ) : (
              <>
                <div className="border-b border-espresso/10 px-5 py-3.5 sm:px-6">
                  <p className="text-sm">{toFree > 0 ? <>Add <b className="font-medium text-cherry-600">{formatPKR(toFree)}</b> more for free delivery</> : "You've unlocked free delivery"}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-espresso/10"><motion.div className="h-full rounded-full bg-gradient-to-r from-saffron to-cherry-600" initial={false} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} /></div>
                </div>
                <ul className="flex-1 space-y-3 overflow-y-auto px-5 py-4 sm:px-6" data-lenis-prevent>
                  <AnimatePresence initial={false}>
                    {lines.map((l) => (
                      <motion.li key={l.key} layout initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} className="flex gap-3 rounded-2xl bg-white p-3">
                        <ProductImage product={l} bg="#F7E9DA" className="h-[72px] w-[72px] shrink-0 rounded-xl" sizes="72px" still />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-lg leading-tight">{l.name}</p>
                          {l.optionsLabel && <p className="truncate text-xs text-espresso-muted">{l.optionsLabel}</p>}
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center rounded-full border border-espresso/15">
                              <button onClick={() => setQty(l.key, l.qty - 1)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-espresso/5" aria-label={`Remove one ${l.name}`}><MinusIcon width={12} /></button>
                              <span className="w-5 text-center text-sm tabular-nums">{l.qty}</span>
                              <button onClick={() => setQty(l.key, l.qty + 1)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-espresso/5" aria-label={`Add one ${l.name}`}><PlusIcon width={12} /></button>
                            </div>
                            <span className="font-medium tabular-nums">{formatPKR(l.unitPrice * l.qty)}</span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                <div className="border-t border-espresso/10 px-5 py-5 sm:px-6">
                  <div className="flex items-baseline justify-between"><span className="text-sm uppercase tracking-[0.2em] text-espresso-muted">Subtotal</span><span className="h-display text-3xl tabular-nums">{formatPKR(subtotal)}</span></div>
                  <Link href="/checkout" onClick={close} className="btn-primary mt-4 w-full">Checkout</Link>
                  <button onClick={close} className="btn-ghost mx-auto mt-2 flex">Keep browsing</button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
