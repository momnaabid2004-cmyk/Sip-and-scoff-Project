"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { useApi } from "@/hooks/useApi";
import { useSite } from "@/components/providers/SiteProvider";
import { Field, errProps } from "@/components/ui/Field";
import { formatPKR } from "@/lib/pricing";
import { waNumber } from "@/lib/phone";
import type { PublicOrder } from "@/lib/public-order";

const STEPS = [
  { key: "new", label: "Order received", at: (o: PublicOrder) => o.createdAt },
  { key: "confirmed", label: "Confirmed by phone", at: (o: PublicOrder) => o.timeline.confirmedAt },
  { key: "preparing", label: "Being prepared", at: (o: PublicOrder) => o.timeline.preparingAt },
  { key: "on-the-way", label: "On the way", at: (o: PublicOrder) => o.timeline.dispatchedAt },
  { key: "completed", label: "Delivered", at: (o: PublicOrder) => o.timeline.completedAt },
] as const;
const PAY = { cod: "Cash on delivery", card: "Card on delivery", jazzcash: "JazzCash", easypaisa: "Easypaisa" } as const;
const time = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-PK", { hour: "numeric", minute: "2-digit", day: "numeric", month: "short", timeZone: "Asia/Karachi" }) : "");

/** Customer order tracking: order number + phone → live status (auto-refreshes every 30 s while open). */
export function TrackOrder({ initialCode }: { initialCode: string }) {
  const { settings: s } = useSite();
  const [code, setCode] = useState(initialCode);
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const { call, busy, error, fields } = useApi();

  const lookup = async (quiet = false) => {
    const res = await call<PublicOrder>("/api/orders/track", { body: { code, phone } });
    if (res) setOrder(res);
    else if (!quiet) setOrder(null);
  };

  useEffect(() => {
    if (!order || order.status === "completed" || order.status === "cancelled") return;
    const t = setInterval(() => lookup(true), 30_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.code, order?.status]);

  const steps = order?.type === "pickup" ? STEPS.filter((x) => x.key !== "on-the-way").map((x) => (x.key === "completed" ? { ...x, label: "Picked up" } : x)) : STEPS;
  const current = order ? steps.findIndex((x) => x.key === order.status) : -1;

  return (
    <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1fr_1.2fr]">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          lookup();
        }}
        className="card h-fit p-6 sm:p-8"
      >
        <p className="eyebrow">Order status</p>
        <h1 className="h-display mt-3 text-5xl">Track your order</h1>
        <p className="mt-3 text-sm text-espresso-muted">Enter the order number from your confirmation screen and the mobile number you used at checkout.</p>
        <div className="mt-6 space-y-4">
          <Field id="tr-code" label="Order number" error={fields.code} hint="e.g. SS-1001">
            <input {...errProps("tr-code", fields.code)} className="input uppercase" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" />
          </Field>
          <Field id="tr-phone" label="Mobile number" error={fields.phone} hint="e.g. 0300 1234567">
            <input {...errProps("tr-phone", fields.phone)} className="input" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" />
          </Field>
        </div>
        {error && <p role="alert" className="mt-4 rounded-2xl bg-blush px-4 py-3 text-sm font-medium text-cherry-600">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary mt-6 w-full">{busy ? "Checking…" : "Check status"}</button>
        <p className="mt-4 text-center text-xs text-espresso-muted">
          Need help? <a className="underline" href={`https://wa.me/${waNumber(s.whatsapp)}`} target="_blank" rel="noopener noreferrer">WhatsApp {s.whatsapp}</a>
        </p>
      </form>

      <div aria-live="polite">
        {!order ? (
          <div className="card grid h-full min-h-[280px] place-items-center p-8 text-center text-espresso-muted">
            <p>Your order's progress will appear here.<br /><Link href="/menu" className="mt-3 inline-block underline">Hungry? Browse the menu</Link></p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6 sm:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-display text-3xl text-cherry-600">{order.code}</p>
              <p className="text-sm text-espresso-muted">Placed {time(order.createdAt)}</p>
            </div>
            <p className="mt-1 text-sm">Hi {order.firstName}! {order.type === "delivery" ? `Delivery to ${order.area}` : "Pickup from the café"} · {PAY[order.payment as keyof typeof PAY] ?? order.payment}</p>

            {order.status === "cancelled" ? (
              <p role="status" className="mt-6 rounded-2xl bg-blush px-4 py-3 text-sm font-medium text-cherry-600">This order was cancelled{order.timeline.cancelledAt ? ` at ${time(order.timeline.cancelledAt)}` : ""}. Please contact us if this is unexpected.</p>
            ) : (
              <ol className="mt-6 space-y-4" aria-label="Order progress">
                {steps.map((st, i) => {
                  const done = i <= current;
                  return (
                    <li key={st.key} className="flex items-center gap-4">
                      <span className={clsx("grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-medium", done ? "bg-cherry-600 text-white" : "border border-espresso/20 text-espresso-muted")} aria-hidden="true">{done ? "✓" : i + 1}</span>
                      <span className="flex-1"><span className={clsx("block", done ? "font-medium" : "text-espresso-muted")}>{st.label}</span>{done && st.at(order) && <span className="block text-xs text-espresso-muted">{time(st.at(order))}</span>}</span>
                      {i === current && order.status !== "completed" && <span className="chip bg-butter text-espresso">Now</span>}
                    </li>
                  );
                })}
              </ol>
            )}

            <ul className="mt-6 space-y-2 border-t-2 border-dashed border-espresso/15 pt-4 text-sm">
              {order.items.map((it, i) => (
                <li key={i} className="flex justify-between gap-3"><span><b>{it.qty}×</b> {it.name}{it.options && <span className="block text-xs text-espresso-muted">{it.options}</span>}</span><span className="tabular-nums">{formatPKR(it.lineTotal)}</span></li>
              ))}
              <li className="flex justify-between pt-2 text-espresso-muted"><span>{order.type === "pickup" ? "Pickup" : "Delivery"}</span><span>{order.deliveryFee ? formatPKR(order.deliveryFee) : "Free"}</span></li>
              <li className="flex justify-between font-display text-2xl"><span>Total</span><span className="tabular-nums">{formatPKR(order.total)}</span></li>
            </ul>
          </motion.div>
        )}
      </div>
    </div>
  );
}
