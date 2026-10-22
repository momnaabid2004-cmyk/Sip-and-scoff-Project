"use client";
import { useState } from "react";
import type { Subscriber } from "@/lib/db/types";
import { useApi } from "@/hooks/useApi";
import { timeAgo } from "@/lib/admin-format";
import { TrashIcon } from "@/components/ui/Icons";
import { Empty, PageHeader, Panel, badge } from "./ui";

/** Newsletter sign-ups from the home page. */
export function SubscribersManager({ initial }: { initial: Subscriber[] }) {
  const [rows, setRows] = useState(initial);
  const api = useApi();
  const active = rows.filter((r) => r.active).length;
  const remove = async (s: Subscriber) => {
    if (!confirm(`Remove ${s.email} permanently?`)) return;
    if (await api.call(`/api/admin/subscribers/${s.id}`, { method: "DELETE" })) setRows((r) => r.filter((x) => x.id !== s.id));
  };
  return (
    <>
      <PageHeader
        title="Subscribers"
        sub={`${active} active · ${rows.length - active} unsubscribed — download the CSV to import into Mailchimp, Brevo or Resend Broadcasts (it includes each person's unsubscribe link).`}
        action={<a href="/api/admin/subscribers?format=csv" className="btn-primary !py-2.5">Download CSV</a>}
      />
      {api.error && <p role="alert" className="mb-4 rounded-2xl bg-berry-light px-4 py-3 text-sm font-bold text-berry-600">{api.error}</p>}
      <Panel>
        {rows.length === 0 ? (
          <Empty>No subscribers yet — the newsletter box is at the bottom of the home page.</Empty>
        ) : (
          <ul className="divide-y divide-cocoa/10">
            {rows.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                <span className="font-bold">{s.email}</span>
                <span className={badge(s.active ? "green" : "grey")}>{s.active ? "Active" : "Unsubscribed"}</span>
                <span className="ml-auto text-xs text-cocoa-muted">{timeAgo(s.createdAt)}</span>
                <button onClick={() => remove(s)} className="btn-ghost !px-2 text-berry-600" aria-label={`Remove ${s.email}`}><TrashIcon width={14} /></button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
