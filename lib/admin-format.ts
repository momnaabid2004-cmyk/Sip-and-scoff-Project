import type { OrderStatus } from "@/lib/db/types";

export const STATUS: Record<OrderStatus, { label: string; tone: "green" | "amber" | "red" | "blue" | "grey" | "purple" }> = {
  new: { label: "New", tone: "red" },
  confirmed: { label: "Confirmed", tone: "purple" },
  preparing: { label: "Preparing", tone: "amber" },
  "on-the-way": { label: "On the way", tone: "blue" },
  completed: { label: "Completed", tone: "green" },
  cancelled: { label: "Cancelled", tone: "grey" },
};
export const PAYMENT_LABEL = { cod: "Cash", jazzcash: "JazzCash", easypaisa: "Easypaisa", card: "Card" } as const;

export const timeAgo = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(iso).toLocaleDateString("en-PK", { day: "numeric", month: "short" });
};
