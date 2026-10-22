"use client";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { clsx } from "clsx";
import { useCart } from "@/components/providers/CartProvider";
import { useSite } from "@/components/providers/SiteProvider";
import { useApi } from "@/hooks/useApi";
import { Field, errProps } from "@/components/ui/Field";
import { ProductImage } from "@/components/art/ProductImage";
import { Food3D } from "@/components/three/Food3D";
import { formatPKR } from "@/lib/pricing";
import type { PaymentMethod } from "@/lib/db/types";
import { waNumber } from "@/lib/phone";

const PAYMENTS: { id: PaymentMethod; label: string; note: string }[] = [
  { id: "cod", label: "Cash on delivery", note: "Pay the rider / at the counter" },
  { id: "jazzcash", label: "JazzCash", note: "Pay to our JazzCash on delivery / pickup" },
  { id: "easypaisa", label: "Easypaisa", note: "Pay to our Easypaisa on delivery / pickup" },
  { id: "card", label: "Card on delivery", note: "Rider carries a card machine" },
];

/** Checkout. The server recalculates every price — this screen just mirrors it. */
export function CheckoutClient() {
  const { lines, subtotal, clear } = useCart();
  const { settings: s } = useSite();
  const [type, setType] = useState<"delivery" | "pickup">("delivery");
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [c, setC] = useState({ name: "", phone: "", email: "", address: "", area: "", notes: "" });
  const [done, setDone] = useState<{ code: string; total: number } | null>(null);
  const { call, busy, error, fields } = useApi();
  const fee = type === "pickup" || subtotal >= s.freeDeliveryOver ? 0 : s.deliveryFee;
  const set = (k: keyof typeof c) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setC((x) => ({ ...x, [k]: e.target.value }));

  if (done)
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card mx-auto max-w-lg p-8 text-center" role="status">
        <div className="mx-auto h-32 w-32"><Food3D kind="cup" tint="#B9814F" /></div>
        <h1 className="h-display mt-4 text-5xl">Order placed!</h1>
        <p className="mt-2 text-espresso-muted">Your order number is</p>
        <p className="mt-1 font-display text-3xl font-medium text-cherry-600">{done.code}</p>
        <p className="mt-2 text-sm font-medium">We will call {c.phone} to confirm your order before we start preparing it.</p>
        <p className="mt-2 text-xs text-espresso-muted">Save this number — use it with your mobile number to track the order.</p>
        <p className="mt-4 text-sm">Total {formatPKR(done.total)} · {type === "delivery" ? `arriving in ${s.deliveryTime}` : "ready for pickup in ~15 minutes"}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={`/track?code=${encodeURIComponent(done.code)}`} className="btn-primary">Track your order</Link>
          <a href={`https://wa.me/${waNumber(s.whatsapp)}?text=${encodeURIComponent(`Hi! Checking on my order ${done.code}`)}`} target="_blank" rel="noopener noreferrer" className="btn border-espresso bg-mint text-espresso">WhatsApp us</a>
          <Link href="/menu" className="btn-light">Back to menu</Link>
        </div>
      </motion.div>
    );

  if (!lines.length)
    return (
      <div className="card mx-auto max-w-lg p-10 text-center">
        <div className="mx-auto h-32 w-32"><Food3D kind="cup" tint="#C9956B" /></div>
        <h1 className="h-display mt-4 text-3xl">Your cart is empty</h1>
        <Link href="/menu" className="btn-primary mt-6">Browse the menu</Link>
      </div>
    );

  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const res = await call<{ code: string; total: number }>("/api/orders", {
          body: { type, payment, customer: c, items: lines.map((l) => ({ productId: l.productId, qty: l.qty, choiceIds: l.choiceIds })) },
        });
        if (res) {
          setDone(res);
          clear();
        }
      }}
      className="grid gap-6 lg:grid-cols-[1.3fr_1fr]"
    >
      <div className="space-y-6">
        <h1 className="h-display text-center text-5xl sm:text-6xl lg:text-left">Checkout</h1>
        <div className="card p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-2 rounded-full border border-espresso/15 bg-vanilla p-1" role="radiogroup" aria-label="Order type">
            {(["delivery", "pickup"] as const).map((t) => (
              <button key={t} type="button" role="radio" aria-checked={type === t} onClick={() => setType(t)} className={clsx("focus-ring relative rounded-full py-2.5 text-sm font-medium capitalize", type === t ? "text-vanilla" : "text-espresso")}>
                {type === t && <motion.span layoutId="otype" className="absolute inset-0 rounded-full bg-espresso" />}
                <span className="relative">{t === "delivery" ? "Delivery" : "Pickup"}</span>
              </button>
            ))}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field id="co-name" label="Full name *" error={fields["customer.name"]}><input {...errProps("co-name", fields["customer.name"])} className="input" value={c.name} onChange={set("name")} autoComplete="name" /></Field>
            <Field id="co-phone" label="Mobile number *" error={fields["customer.phone"]} hint="e.g. 0300 1234567"><input {...errProps("co-phone", fields["customer.phone"])} className="input" value={c.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" /></Field>
            <Field id="co-email" label="Email (optional)" error={fields["customer.email"]}><input {...errProps("co-email", fields["customer.email"])} className="input" type="email" value={c.email} onChange={set("email")} autoComplete="email" /></Field>
            <AnimatePresence initial={false}>
              {type === "delivery" && (
                <motion.div key="addr" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="grid gap-4 overflow-hidden sm:col-span-2 sm:grid-cols-[1.6fr_1fr]">
                  <Field id="co-address" label="Delivery address *" error={fields["customer.address"]}><input {...errProps("co-address", fields["customer.address"])} className="input" value={c.address} onChange={set("address")} placeholder="House #, street, block" autoComplete="street-address" /></Field>
                  <Field id="co-area" label="Area *" error={fields["customer.area"]}>
                    <select {...errProps("co-area", fields["customer.area"])} className="input" value={c.area} onChange={set("area")}>
                      <option value="">Choose…</option>
                      {s.deliveryAreas.map((a) => <option key={a}>{a}</option>)}
                    </select>
                  </Field>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="sm:col-span-2"><Field id="co-notes" label="Notes for the kitchen / rider"><textarea id="co-notes" rows={2} className="input resize-none" value={c.notes} onChange={set("notes")} placeholder="Less sugar in the chai, ring the bell twice…" /></Field></div>
          </div>
        </div>

        <fieldset className="card p-5 sm:p-6">
          <legend className="sr-only">Payment method</legend>
          <p className="font-display text-2xl">Payment</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {PAYMENTS.map((p) => (
              <label key={p.id} className={clsx("flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors", payment === p.id ? "border-espresso bg-butter" : "border-espresso/15 bg-white")}>
                <input type="radio" name="payment" value={p.id} checked={payment === p.id} onChange={() => setPayment(p.id)} className="mt-1 accent-[#C2364A]" />
                <span><span className="block text-sm font-medium">{p.label}</span><span className="block text-xs text-espresso-muted">{p.note}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <aside className="card h-fit p-5 sm:p-6 lg:sticky lg:top-28">
        <h2 className="font-display text-2xl">Order summary</h2>
        <ul className="mt-4 space-y-3">
          {lines.map((l) => (
            <li key={l.key} className="flex items-center gap-3">
              <ProductImage product={l} bg="#FFF4E6" className="h-12 w-12 shrink-0 rounded-xl" sizes="48px" />
              <span className="min-w-0 flex-1 text-sm"><b>{l.qty}×</b> {l.name}{l.optionsLabel && <span className="block truncate text-xs text-espresso-muted">{l.optionsLabel}</span>}</span>
              <span className="text-sm font-medium tabular-nums">{formatPKR(l.unitPrice * l.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-5 space-y-2 border-t-2 border-dashed border-espresso/15 pt-4 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{formatPKR(subtotal)}</dd></div>
          <div className="flex justify-between"><dt>{type === "pickup" ? "Pickup" : "Delivery"}</dt><dd className="tabular-nums">{fee ? formatPKR(fee) : "Free"}</dd></div>
          <div className="flex justify-between border-t-2 border-espresso/10 pt-3 font-display text-2xl"><dt>Total</dt><dd className="tabular-nums">{formatPKR(subtotal + fee)}</dd></div>
        </dl>
        {error && <p role="alert" className="mt-4 rounded-2xl bg-blush px-4 py-3 text-sm font-medium text-cherry-600">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary mt-5 w-full">{busy ? "Placing order…" : `Place order · ${formatPKR(subtotal + fee)}`}</button>
        <p className="mt-3 text-center text-xs text-espresso-muted">You pay when your order arrives or at pickup — no online payment needed.</p>
      </aside>
    </form>
  );
}
