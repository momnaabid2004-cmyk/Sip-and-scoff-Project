"use client";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import type { Product } from "@/lib/db/types";

type Toast = { id: number; title: string; desc?: string };
type UI = {
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  chatOpen: boolean;
  setChatOpen: (v: boolean) => void;
  product: Product | null;
  openProduct: (p: Product | null) => void;
  toasts: Toast[];
  toast: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
};
const Ctx = createContext<UI | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [product, openProduct] = useState<Product | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const id = useRef(1);
  const dismiss = useCallback((x: number) => setToasts((t) => t.filter((y) => y.id !== x)), []);
  const toast = useCallback(
    (t: Omit<Toast, "id">) => {
      const n = id.current++;
      setToasts((p) => [...p.slice(-2), { ...t, id: n }]);
      setTimeout(() => dismiss(n), 3200);
    },
    [dismiss]
  );
  return <Ctx.Provider value={{ cartOpen, setCartOpen, chatOpen, setChatOpen, product, openProduct, toasts, toast, dismiss }}>{children}</Ctx.Provider>;
}
export const useUI = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useUI must be used inside UIProvider");
  return c;
};
