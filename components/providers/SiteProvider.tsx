"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { Category, Settings } from "@/lib/db/types";

type Site = { settings: Settings; categories: Category[] };
const Ctx = createContext<Site | null>(null);

/** Settings + categories loaded on the server, shared with client components. */
export function SiteProvider({ value, children }: { value: Site; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useSite = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSite must be used inside SiteProvider");
  return c;
};
