"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { clsx } from "clsx";
import { useUI } from "@/components/providers/UIProvider";
import { useCart } from "@/components/providers/CartProvider";
import { useSite } from "@/components/providers/SiteProvider";
import { useLockWhile } from "@/hooks/useLockWhile";
import { ProductImage } from "@/components/art/ProductImage";
import { FLAVOUR, TAG_LABEL } from "@/lib/theme";
import { defaultChoices, formatPKR, optionsLabel, unitPrice } from "@/lib/pricing";
import { CloseIcon, MinusIcon, PlusIcon } from "@/components/ui/Icons";

/** Customise sheet: bottom sheet on phones, split dialog on larger screens. Live price, animated illustration. */
export function ProductModal() {
  const { product: p, openProduct, toast } = useUI();
  const { add } = useCart();
  const { categories } = useSite();
  const [choices, setChoices] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const close = () => openProduct(null);
  useLockWhile(!!p, close);

  useEffect(() => {
    if (p) {
      setChoices(defaultChoices(p.options));
      setQty(1);
    }
  }, [p]);

  const cat = categories.find((c) => c.id === p?.categoryId);
  const f = FLAVOUR[cat?.color ?? "berry"];
  const each = p ? unitPrice(p, choices) : 0;

  const toggle = (groupId: string, choiceId: string, multi: boolean) => {
    if (!p) return;
    const ids = p.options.find((g) => g.id === groupId)!.choices.map((c) => c.id);
    setChoices((prev) => (multi ? (prev.includes(choiceId) ? prev.filter((x) => x !== choiceId) : [...prev, choiceId]) : [...prev.filter((x) => !ids.includes(x)), choiceId]));
  };

  return (
    <AnimatePresence>
      {p && (
        <>
          <motion.div key="pm-bg" className="fixed inset-0 z-[80] bg-espresso/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
          <div key="pm-wrap" className="pointer-events-none fixed inset-0 z-[81] flex items-end justify-center md:items-center md:p-8">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="pm-title"
              initial={{ y: "100%", opacity: 0.6 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 32 }}
              className="pointer-events-auto flex max-h-[94svh] w-full flex-col overflow-hidden rounded-t-[32px] bg-vanilla md:grid md:max-h-[86svh] md:max-w-5xl md:grid-cols-[1fr_1.05fr] md:rounded-[32px]"
            >
              <div className="relative shrink-0">
                <ProductImage product={p} bg={f.lightHex} three="standalone" className="aspect-[16/11] md:aspect-auto md:h-full" sizes="(max-width: 768px) 100vw, 480px" />
                <span className="absolute left-1/2 top-2.5 h-1.5 w-12 -translate-x-1/2 rounded-full bg-espresso/25 md:hidden" aria-hidden="true" />
                <button onClick={close} className="focus-ring absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-white/90 md:hidden" aria-label="Close"><CloseIcon width={18} /></button>
              </div>
              <div className="flex min-h-0 flex-col">
                <div className="flex-1 overflow-y-auto px-5 pb-4 pt-5 sm:px-8 sm:pt-8" data-lenis-prevent>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={clsx("text-[11px] font-medium uppercase tracking-[0.24em]", f.text)}>{cat?.name}</p>
                      <h2 id="pm-title" className="h-display mt-2 text-4xl sm:text-5xl">{p.name}</h2>
                    </div>
                    <button onClick={close} className="focus-ring hidden h-11 w-11 shrink-0 place-items-center rounded-full border border-espresso/20 md:grid" aria-label="Close"><CloseIcon width={18} /></button>
                  </div>
                  <p className="mt-3 font-light leading-relaxed text-espresso-muted">{p.description}</p>
                  {p.tags.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{p.tags.map((t) => <span key={t} className="chip border border-espresso/15 uppercase tracking-[0.14em]">{TAG_LABEL[t]}</span>)}</div>}
                  {p.options.map((g) => (
                    <fieldset key={g.id} className="mt-7">
                      <legend className="mb-3 flex w-full items-center justify-between text-[11px] font-medium uppercase tracking-[0.24em] text-espresso-muted">
                        {g.name}
                        <span className="normal-case tracking-normal">{g.multi ? "Choose any" : g.required ? "Required" : "Optional"}</span>
                      </legend>
                      <div className={clsx("grid gap-2", g.choices.length <= 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2")}>
                        {g.choices.map((c) => {
                          const on = choices.includes(c.id);
                          return (
                            <motion.button key={c.id} type="button" whileTap={{ scale: 0.96 }} aria-pressed={on} onClick={() => toggle(g.id, c.id, g.multi)} className={clsx("focus-ring min-h-[52px] rounded-2xl border px-3.5 py-2.5 text-left transition-colors duration-300", on ? "border-espresso bg-espresso text-vanilla" : "border-espresso/15 bg-white text-espresso hover:border-espresso/40")}>
                              <span className="block text-[15px]">{c.label}</span>
                              <span className={clsx("block text-xs", on ? "text-saffron" : "text-espresso-muted")}>{c.priceDelta > 0 ? `+ ${formatPKR(c.priceDelta)}` : "Included"}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </fieldset>
                  ))}
                </div>
                <div className="flex items-center gap-3 border-t border-espresso/10 bg-vanilla p-4 sm:px-8 sm:py-5">
                  <div className="flex items-center rounded-full border border-espresso/20 p-1">
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-10 w-10 place-items-center rounded-full hover:bg-espresso/5" aria-label="Decrease quantity"><MinusIcon width={14} /></button>
                    <span className="w-6 text-center tabular-nums" aria-live="polite">{qty}</span>
                    <button onClick={() => setQty((q) => Math.min(50, q + 1))} className="grid h-10 w-10 place-items-center rounded-full hover:bg-espresso/5" aria-label="Increase quantity"><PlusIcon width={14} /></button>
                  </div>
                  <button
                    onClick={() => {
                      add({ productId: p.id, name: p.name, unitPrice: each, choiceIds: choices, optionsLabel: optionsLabel(p.options, choices), art: p.art, tint: p.tint, image: p.image }, qty);
                      toast({ title: `${qty} × ${p.name} added`, desc: optionsLabel(p.options, choices) || undefined });
                      close();
                    }}
                    className="btn-primary flex-1 !justify-between !pl-6 !pr-1.5"
                  >
                    Add to cart
                    <motion.span key={each * qty} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="rounded-full bg-white/95 px-4 py-2 text-[15px] normal-case tracking-normal text-espresso tabular-nums">
                      {formatPKR(each * qty)}
                    </motion.span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
