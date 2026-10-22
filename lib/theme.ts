import type { FlavourColor } from "@/lib/db/types";

/**
 * Category theming. The stored keys (cocoa, chai, berry…) are kept for database compatibility;
 * they now map onto the Sweet Roast palette.
 */
export const FLAVOUR: Record<FlavourColor, { bg: string; light: string; text: string; hex: string; lightHex: string; label: string; family: string }> = {
  cocoa: { bg: "bg-[#8A5A3C]", light: "bg-latte-light", text: "text-latte-600", hex: "#8A5A3C", lightHex: "#F1DFCB", label: "Coffee brown", family: "coffee" },
  chai: { bg: "bg-latte", light: "bg-[#F6E6D2]", text: "text-latte-600", hex: "#C9956B", lightHex: "#F6E6D2", label: "Chai", family: "tea" },
  berry: { bg: "bg-cherry", light: "bg-blush", text: "text-cherry-700", hex: "#F4B3BE", lightHex: "#F8CFCB", label: "Strawberry", family: "icecream" },
  lagoon: { bg: "bg-mint", light: "bg-mint-light", text: "text-mint-600", hex: "#8CC7A6", lightHex: "#D3EDDF", label: "Mint", family: "cold" },
  pista: { bg: "bg-peach", light: "bg-peach-light", text: "text-peach-600", hex: "#F4B3BE", lightHex: "#FBE3D6", label: "Peach", family: "shake" },
  mango: { bg: "bg-saffron", light: "bg-butter", text: "text-saffron-600", hex: "#E3B26E", lightHex: "#FCE3A6", label: "Saffron", family: "snack" },
  ube: { bg: "bg-[#7A3A1E]", light: "bg-vanilla-200", text: "text-peach-600", hex: "#7A3A1E", lightHex: "#F7E9DA", label: "Caramel", family: "dessert" },
};

export const TAG_LABEL: Record<string, string> = {
  bestseller: "Bestseller",
  new: "New",
  veg: "Veg",
  spicy: "Spicy",
  seasonal: "Seasonal",
  "low-caffeine": "Low caffeine",
};
