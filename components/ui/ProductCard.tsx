"use client";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import type { Product } from "@/lib/db/types";
import { useSite } from "@/components/providers/SiteProvider";
import { useUI } from "@/components/providers/UIProvider";
import { useCart } from "@/components/providers/CartProvider";
import { ProductImage } from "@/components/art/ProductImage";
import { FLAVOUR, TAG_LABEL } from "@/lib/theme";
import { defaultChoices, formatPKR, optionsLabel, unitPrice } from "@/lib/pricing";
import { PlusIcon } from "./Icons";

/**
 * Menu card. The 3D model plays its category's signature motion (steam, pour, scoop drop, fizz, stacking…). Items with options open the customise sheet; simple items add instantly.
 */
export function ProductCard({ product, priority, compact }: { product: Product; priority?: boolean; compact?: boolean }) {
  const { categories } = useSite();
  const { openProduct, toast } = useUI();
  const { add } = useCart();
  const cat = categories.find((c) => c.id === product.categoryId);
  const f = FLAVOUR[cat?.color ?? "berry"];
  const badge = product.tags.includes("bestseller") ? "Bestseller" : product.tags.includes("new") ? "New" : product.tags.includes("seasonal") ? "Seasonal" : null;

  const quickAdd = () => {
    if (product.options.length) return openProduct(product);
    const ids = defaultChoices(product.options);
    add({ productId: product.id, name: product.name, unitPrice: unitPrice(product, ids), choiceIds: ids, optionsLabel: optionsLabel(product.options, ids), art: product.art, tint: product.tint, image: product.image });
    toast({ title: `${product.name} added`, desc: formatPKR(product.price) });
  };

  return (
    <div className="h-full">
      <motion.article whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 260, damping: 22 }} className="group flex h-full flex-col rounded-[24px] bg-white p-2 shadow-[0_1px_0_rgba(42,24,16,0.06)] transition-shadow duration-500 hover:shadow-card sm:rounded-[28px] sm:p-2.5">
        <button onClick={() => openProduct(product)} className="focus-ring relative block rounded-[18px] text-left sm:rounded-[22px]" aria-label={`View ${product.name}`}>
          <ProductImage product={product} bg={f.lightHex} priority={priority} three className={clsx("rounded-[18px] sm:rounded-[22px]", compact ? "aspect-square" : "aspect-[5/4] sm:aspect-[5/6]")} />
          {badge && <span className={clsx("chip absolute left-2.5 top-2.5 z-[25] uppercase tracking-[0.16em] sm:left-3 sm:top-3", badge === "Bestseller" ? "bg-espresso text-vanilla" : "bg-white text-espresso")}>{badge}</span>}
          {product.tags.includes("veg") && <span className="absolute right-2.5 top-2.5 z-[25] grid h-6 w-6 place-items-center rounded-md border border-mint-600 bg-white sm:right-3 sm:top-3" title="Vegetarian"><span className="h-2.5 w-2.5 rounded-full bg-mint-600" /><span className="sr-only">Vegetarian</span></span>}
        </button>
        <div className="flex flex-1 flex-col px-1.5 pb-1.5 pt-3 sm:px-2.5 sm:pt-4">
          <p className={clsx("text-[10px] font-medium uppercase tracking-[0.22em] sm:text-[11px]", f.text)}>{cat?.name}</p>
          <h3 className="mt-1 font-display text-[19px] leading-[1.1] sm:text-2xl">{product.name}</h3>
          {!compact && <p className="mt-1.5 line-clamp-2 text-[13px] font-light leading-relaxed text-espresso-muted sm:text-sm">{product.description}</p>}
          <div className="mt-auto flex items-center justify-between gap-2 pt-3 sm:pt-4">
            <span className="text-[15px] font-medium tabular-nums sm:text-[17px]">{formatPKR(product.price)}</span>
            <button
              onClick={quickAdd}
              className="focus-ring grid h-11 w-11 shrink-0 place-items-center rounded-full bg-cherry-600 text-white shadow-glow transition-transform duration-300 ease-expo hover:scale-110 hover:rotate-90 active:scale-95"
              aria-label={product.options.length ? `Customise ${product.name}` : `Add ${product.name} to cart`}
            >
              <PlusIcon width={18} />
            </button>
          </div>
          {product.tags.filter((t) => t !== "bestseller" && t !== "new" && t !== "veg" && t !== "seasonal").length > 0 && !compact && (
            <p className="mt-2 text-[11px] text-espresso-muted">{product.tags.filter((t) => ["spicy", "low-caffeine"].includes(t)).map((t) => TAG_LABEL[t]).join(" · ")}</p>
          )}
        </div>
      </motion.article>
    </div>
  );
}
