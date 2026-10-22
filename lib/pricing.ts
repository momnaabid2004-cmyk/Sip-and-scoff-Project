import type { OptionGroup, Product } from "@/lib/db/types";

/** Price of one unit with the chosen options. Shared by the cart (display) and the order API (authoritative). */
export function unitPrice(p: Pick<Product, "price" | "options">, choiceIds: string[]) {
  let total = p.price;
  for (const g of p.options) for (const c of g.choices) if (choiceIds.includes(c.id)) total += c.priceDelta;
  return total;
}

/** Human summary like "Large · Oat milk · Sprinkles". */
export function optionsLabel(options: OptionGroup[], choiceIds: string[]) {
  return options
    .flatMap((g) => g.choices.filter((c) => choiceIds.includes(c.id)).map((c) => c.label))
    .join(" · ");
}

/** Default choices: first choice of every required single-select group. */
export const defaultChoices = (options: OptionGroup[]) => options.filter((g) => g.required && !g.multi).map((g) => g.choices[0].id);

export const formatPKR = (n: number) => `Rs ${n.toLocaleString("en-PK")}`;

/**
 * Check a customer's option picks against the product (server-side, authoritative).
 * Fills in the default for required single-choice groups the customer skipped. Returns an error message or the clean list.
 */
export function validateChoices(p: Pick<Product, "name" | "options">, choiceIds: string[]): { ok: true; choiceIds: string[] } | { ok: false; error: string } {
  const picked = new Set(choiceIds);
  const known = new Set(p.options.flatMap((g) => g.choices.map((c) => c.id)));
  for (const id of picked) if (!known.has(id)) return { ok: false, error: `An option for ${p.name} is no longer available. Please remove it from your cart and add it again.` };
  const clean: string[] = [];
  for (const g of p.options) {
    const inGroup = g.choices.filter((c) => picked.has(c.id)).map((c) => c.id);
    if (!g.multi && inGroup.length > 1) return { ok: false, error: `Please choose only one ${g.name.toLowerCase()} for ${p.name}.` };
    if (g.required && inGroup.length === 0) {
      if (g.multi) return { ok: false, error: `Please choose a ${g.name.toLowerCase()} for ${p.name}.` };
      inGroup.push(g.choices[0].id);
    }
    clean.push(...inGroup);
  }
  return { ok: true, choiceIds: clean };
}
