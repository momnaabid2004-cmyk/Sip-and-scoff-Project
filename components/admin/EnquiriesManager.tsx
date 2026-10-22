"use client";
import { useState } from "react";
import { clsx } from "clsx";
import type { Enquiry, EnquiryStatus } from "@/lib/db/types";
import { useApi } from "@/hooks/useApi";
import { timeAgo } from "@/lib/admin-format";
import { formatPkPhone, waNumber } from "@/lib/phone";
import { TrashIcon } from "@/components/ui/Icons";
import { Empty, PageHeader, Panel, badge } from "./ui";

const STATUS: Record<EnquiryStatus, { label: string; tone: "red" | "amber" | "green" | "grey" }> = {
  new: { label: "New", tone: "red" },
  contacted: { label: "Contacted", tone: "amber" },
  confirmed: { label: "Confirmed", tone: "green" },
  closed: { label: "Closed", tone: "grey" },
};
const TYPE: Record<string, string> = { table: "Table booking", catering: "Catering", event: "Event", cake: "Birthday cake", callback: "Call-back", other: "Other" };

/** Requests captured by the AI assistant: bookings, catering, cakes, call-backs. */
export function EnquiriesManager({ initial, canWrite }: { initial: Enquiry[]; canWrite: boolean }) {
  const [rows, setRows] = useState(initial);
  const [filter, setFilter] = useState<EnquiryStatus | "all">("all");
  const api = useApi();
  const shown = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  const setStatus = async (e: Enquiry, status: EnquiryStatus) => {
    const res = await api.call<Enquiry>(`/api/admin/enquiries/${e.id}`, { method: "PATCH", body: { status } });
    if (res) setRows((r) => r.map((x) => (x.id === e.id ? res : x)));
  };
  const remove = async (e: Enquiry) => {
    if (!confirm(`Delete the request from ${e.name}?`)) return;
    if (await api.call(`/api/admin/enquiries/${e.id}`, { method: "DELETE" })) setRows((r) => r.filter((x) => x.id !== e.id));
  };

  return (
    <>
      <PageHeader title="Requests" sub={`Bookings, catering, cakes & call-backs taken by the AI assistant · ${rows.filter((r) => r.status === "new").length} new`} />
      {api.error && <p role="alert" className="mb-4 rounded-2xl bg-berry-light px-4 py-3 text-sm font-bold text-berry-600">{api.error}</p>}
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
        {(["all", "new", "contacted", "confirmed", "closed"] as const).map((f) => (
          <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} className={clsx("focus-ring rounded-full px-4 py-1.5 text-sm font-bold", filter === f ? "bg-cocoa text-vanilla" : "bg-white text-cocoa ring-1 ring-cocoa/15")}>
            {f === "all" ? "All" : STATUS[f].label}
          </button>
        ))}
      </div>
      <Panel>
        {shown.length === 0 ? (
          <Empty>{rows.length ? "Nothing with this status." : "No requests yet. When a customer asks the AI assistant for a table, catering or a cake, it appears here."}</Empty>
        ) : (
          <ul className="divide-y divide-cocoa/10">
            {shown.map((e) => (
              <li key={e.id} className={clsx("p-4 sm:p-5", e.status === "new" && "bg-berry-light/30")}>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className={badge(STATUS[e.status].tone)}>{STATUS[e.status].label}</span>
                  <span className={badge("purple")}>{TYPE[e.type] ?? e.type}</span>
                  <span className="font-extrabold">{e.name}</span>
                  <span className="ml-auto text-xs text-cocoa-muted">{timeAgo(e.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm">{e.details}</p>
                <p className="mt-1 text-xs text-cocoa-muted">
                  {[e.date && `Date: ${e.date}`, e.time && `Time: ${e.time}`, e.guests && `Guests: ${e.guests}`, formatPkPhone(e.phone), e.email].filter(Boolean).join(" · ")}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <a href={`https://wa.me/${waNumber(e.phone)}?text=${encodeURIComponent(`Assalam-o-alaikum ${e.name.split(" ")[0]}! This is about your ${(TYPE[e.type] ?? "request").toLowerCase()} request.`)}`} target="_blank" rel="noopener noreferrer" className="btn-light !py-2 !text-xs">WhatsApp</a>
                  <a href={`tel:${e.phone}`} className="btn-light !py-2 !text-xs">Call</a>
                  {canWrite && (
                    <>
                      <label className="sr-only" htmlFor={`st-${e.id}`}>Status</label>
                      <select id={`st-${e.id}`} value={e.status} onChange={(ev) => setStatus(e, ev.target.value as EnquiryStatus)} className="input !w-auto !py-1.5 !text-xs">
                        {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                      <button onClick={() => remove(e)} className="btn-ghost !text-xs text-berry-600"><TrashIcon width={14} /> Delete</button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
