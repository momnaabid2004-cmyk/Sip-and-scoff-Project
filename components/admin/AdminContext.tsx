"use client";
import { createContext, useContext } from "react";
import type { PublicAdmin } from "@/lib/db/types";

export const AdminContext = createContext<PublicAdmin | null>(null);
export const useAdmin = () => {
  const a = useContext(AdminContext);
  if (!a) throw new Error("useAdmin outside AdminShell");
  return a;
};
