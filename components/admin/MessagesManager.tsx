"use client";
import { useState } from "react";
import { clsx } from "clsx";
import type { Message } from "@/lib/db/types";
import { useApi } from "@/hooks/useApi";
import { timeAgo } from "@/lib/admin-format";
import { TrashIcon } from "@/components/ui/Icons";
import { Empty, PageHeader, Panel, badge } from "./ui";

export function MessagesManager({ initial }: { initial: Message[] }) {
  const [rows, setRows] = useState(initial);
  const [open, setOpen] = useState<string | null>(null);
  const api = useApi();

  const markRead = async (m: Message, read: boolean) => {
    const res = await api.call<Message>(`/api/admin/messages/${m.id}`, { method: "PATCH", body: { read } });
    if (res) setRows((r) => r.map((x) => (x.id === m.id ? res : x)));
  };
  const remove = async (m: Message) => {
    if (!confirm("Delete this message?")) return;
    if (await api.call(`/api/admin/messages/${m.id}`, { method: "DELETE" })) setRows((r) => r.filter((x) => x.id !== m.id));
  };

  return (
    <>
      <PageHeader title="Messages" sub={`From the website contact form · ${rows.filter((m) => !m.read).length} unread`} />
      <Panel>
        {rows.length === 0 ? (
          <Empty>No messages yet.</Empty>
        ) : (
          <ul className="divide-y divide-cocoa/10">
            {rows.map((m) => (
              <li key={m.id} className={clsx("p-4", !m.read && "bg-lagoon-light/40")}>
                <button className="flex w-full flex-wrap items-center gap-3 text-left text-sm" onClick={() => { setOpen(open === m.id ? null : m.id); if (!m.read) markRead(m, true); }} aria-expanded={open === m.id}>
                  {!m.read && <span className={badge("blue")}>New</span>}
                  <span className="font-extrabold">{m.name}</span>
                  <span className="truncate text-cocoa-muted">{m.subject || m.message.slice(0, 60)}</span>
                  <span className="ml-auto text-xs text-cocoa-muted">{timeAgo(m.createdAt)}</span>
                </button>
                {open === m.id && (
                  <div className="mt-3 rounded-2xl bg-white p-4 text-sm">
                    <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>
                    <p className="mt-3 text-xs text-cocoa-muted">{m.email}{m.phone && ` · ${m.phone}`}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || "Your message"}`)}`} className="btn-light !py-2 !text-xs">Reply by email</a>
                      <button onClick={() => markRead(m, !m.read)} className="btn-ghost !text-xs">Mark {m.read ? "unread" : "read"}</button>
                      <button onClick={() => remove(m)} className="btn-ghost !text-xs text-berry-600"><TrashIcon width={14} /> Delete</button>
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
