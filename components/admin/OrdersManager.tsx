"use client";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import type { Order, OrderStatus } from "@/lib/db/types";
import { useApi } from "@/hooks/useApi";
import { formatPKR } from "@/lib/pricing";
import { PAYMENT_LABEL, STATUS, timeAgo } from "@/lib/admin-format";
import { Empty, PageHeader, Panel, badge } from "./ui";

const FLOW: OrderStatus[] = ["new", "confirmed", "preparing", "on-the-way", "completed", "cancelled"];
const OPEN: OrderStatus[] = ["new", "confirmed", "preparing", "on-the-way"];

/** Live order board — polls every 20 s so new website orders appear without refreshing. */
export function OrdersManager({ initial }: { initial: Order[] }) {
  const [rows, setRows] = useState(initial);
  const [filter, setFilter] = useState<OrderStatus | "open" | "all">("open");
  const [openId, setOpenId] = useState<string | null>(null);
  const api = useApi();

  useEffect(() => {
    const t = setInterval(async () => {
      const r = await fetch("/api/admin/orders").then((x) => (x.ok ? x.json() : null)).catch(() => null);
      if (r) setRows(r);
    }, 20000);
    return () => clearInterval(t);
  }, []);

  const list = rows.filter((o) => (filter === "all" ? true : filter === "open" ? OPEN.includes(o.status) : o.status === filter));
  const setStatus = async (o: Order, status: OrderStatus) => {
    const res = await api.call<Order>(`/api/admin/orders/${o.id}`, { method: "PATCH", body: { status } });
    if (res) setRows((r) => r.map((x) => (x.id === o.id ? res : x)));
  };

  return (
    <>
      <PageHeader title="Orders" sub="Orders placed from the website checkout. Refreshes automatically." />
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {(["open", "all", ...FLOW] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={clsx("shrink-0 rounded-full border-2 px-3.5 py-1.5 text-xs font-bold", filter === f ? "border-cocoa bg-cocoa text-vanilla" : "border-cocoa/10 bg-white")}>
            {f === "open" ? "Open" : f === "all" ? "All" : STATUS[f].label} <span className="opacity-60">({f === "all" ? rows.length : f === "open" ? rows.filter((o) => OPEN.includes(o.status)).length : rows.filter((o) => o.status === f).length})</span>
          </button>
        ))}
      </div>
      {api.error && <p role="alert" className="mb-4 rounded-2xl bg-berry-light px-4 py-3 text-sm font-bold text-berry-600">{api.error}</p>}
      <Panel>
        {list.length === 0 ? (
          <Empty>No orders here.</Empty>
        ) : (
          <ul className="divide-y divide-cocoa/10">
            {list.map((o) => (
              <li key={o.id} className="p-4">
                <button onClick={() => setOpenId(openId === o.id ? null : o.id)} className="flex w-full flex-wrap items-center gap-3 text-left text-sm" aria-expanded={openId === o.id}>
                  <span className="font-display text-base font-extrabold">{o.code}</span>
                  <span className={badge(STATUS[o.status].tone)}>{STATUS[o.status].label}</span>
                  <span className={badge(o.type === "delivery" ? "blue" : "purple")}>{o.type === "delivery" ? "🛵 Delivery" : "🏃 Pickup"}</span>
                  <span className="text-cocoa-muted">{o.customer.name} · {o.customer.phone}</span>
                  <span className="hidden text-xs text-cocoa-muted md:inline">{PAYMENT_LABEL[o.payment]}</span>
                  <span className="ml-auto font-extrabold">{formatPKR(o.total)}</span>
                  <span className="w-20 text-right text-xs text-cocoa-muted">{timeAgo(o.createdAt)}</span>
                </button>
                {openId === o.id && (
                  <div className="mt-4 grid gap-4 rounded-2xl bg-vanilla-50 p-4 md:grid-cols-2">
                    <div>
                      <p className="label">Items</p>
                      <ul className="space-y-1.5 text-sm">
                        {o.items.map((i, k) => (
                          <li key={k} className="flex justify-between gap-3"><span><b>{i.qty}×</b> {i.name}{i.options && <span className="block text-xs text-cocoa-muted">{i.options}</span>}</span><span className="tabular-nums">{formatPKR(i.unitPrice * i.qty)}</span></li>
                        ))}
                      </ul>
                      <dl className="mt-3 space-y-1 border-t border-cocoa/10 pt-2 text-xs">
                        <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPKR(o.subtotal)}</dd></div>
                        <div className="flex justify-between"><dt>Delivery</dt><dd>{o.deliveryFee ? formatPKR(o.deliveryFee) : "Free"}</dd></div>
                        <div className="flex justify-between font-extrabold"><dt>Total · {PAYMENT_LABEL[o.payment]}</dt><dd>{formatPKR(o.total)}</dd></div>
                      </dl>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div><p className="label">Customer</p><p>{o.customer.name}</p><a href={`tel:${o.customer.phone}`} className="font-bold text-berry-600">{o.customer.phone}</a>{o.customer.email && <p className="text-cocoa-muted">{o.customer.email}</p>}</div>
                      {o.type === "delivery" && <div><p className="label">Address</p><p>{o.customer.address}, {o.customer.area}</p></div>}
                      {o.customer.notes && <div><p className="label">Notes</p><p>{o.customer.notes}</p></div>}
                      <div>
                        <p className="label">Update status</p>
                        {o.status === "new" && <p className="mb-2 rounded-xl bg-butter px-3 py-2 text-xs font-bold text-cocoa">Call the customer on {o.customer.phone} to confirm, then mark it Confirmed.</p>}
                        <div className="flex flex-wrap gap-2">
                          {FLOW.map((s) => (
                            <button key={s} disabled={api.busy || s === o.status} onClick={() => setStatus(o, s)} className={clsx("rounded-full border-2 px-3 py-1.5 text-xs font-bold disabled:cursor-default", s === o.status ? "border-cocoa bg-cocoa text-vanilla" : "border-cocoa/15 bg-white hover:border-cocoa")}>
                              {STATUS[s].label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <a href={`https://wa.me/${o.customer.phone.replace(/\D/g, "").replace(/^0/, "92")}?text=${encodeURIComponent(`Assalam-o-alaikum ${o.customer.name}! Your order ${o.code} is ${STATUS[o.status].label.toLowerCase()}.`)}`} target="_blank" rel="noopener noreferrer" className="btn-light !py-2 !text-xs">Message on WhatsApp</a>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
