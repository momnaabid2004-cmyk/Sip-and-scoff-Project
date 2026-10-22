"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ArtKind } from "@/lib/db/types";

export type CartLine = {
  key: string; // productId + chosen options
  productId: string;
  name: string;
  unitPrice: number;
  qty: number;
  choiceIds: string[];
  optionsLabel: string;
  art: ArtKind;
  tint: string;
  image: string | null;
};

type Cart = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (line: Omit<CartLine, "key" | "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
};

const Ctx = createContext<Cart | null>(null);
const KEY = "sip-scoop-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, ready]);

  const add = useCallback((l: Omit<CartLine, "key" | "qty">, qty = 1) => {
    const key = `${l.productId}|${[...l.choiceIds].sort().join(",")}`;
    setLines((prev) => (prev.some((x) => x.key === key) ? prev.map((x) => (x.key === key ? { ...x, qty: x.qty + qty } : x)) : [...prev, { ...l, key, qty }]));
  }, []);
  const setQty = useCallback((key: string, qty: number) => setLines((p) => (qty <= 0 ? p.filter((x) => x.key !== key) : p.map((x) => (x.key === key ? { ...x, qty } : x)))), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(
    () => ({ lines, add, setQty, clear, count: lines.reduce((a, l) => a + l.qty, 0), subtotal: lines.reduce((a, l) => a + l.qty * l.unitPrice, 0) }),
    [lines, add, setQty, clear]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useCart = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
};
