import type { Order } from "@/lib/db/types";

/** Only what a customer needs to see — no address or full phone number in the response. */
export function publicOrder(o: Order) {
  return {
    code: o.code,
    status: o.status,
    type: o.type,
    firstName: o.customer.name.split(" ")[0],
    area: o.customer.area,
    items: o.items.map((i) => ({ name: i.name, qty: i.qty, options: i.options, lineTotal: i.unitPrice * i.qty })),
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    total: o.total,
    payment: o.payment,
    createdAt: o.createdAt,
    timeline: o.timeline,
  };
}
export type PublicOrder = ReturnType<typeof publicOrder>;
