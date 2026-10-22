"use client";
import { Fragment, useState } from "react";
import { clsx } from "clsx";
import type { ChatConversationSummary, ChatMessageRow } from "@/lib/db/types";
import { useApi } from "@/hooks/useApi";
import { timeAgo } from "@/lib/admin-format";
import { TrashIcon } from "@/components/ui/Icons";
import { Drawer, Empty, PageHeader, Panel, badge } from "./ui";

type Usage = { conversations: number; messages: number; inputTokens: number; outputTokens: number };
type Props = {
  initial: { rows: ChatConversationSummary[]; total: number };
  usage: { today: Usage; month: Usage };
  cost: { inPerM: number; outPerM: number } | null;
  ai: { provider: string; model: string; enabled: boolean };
  canDelete: boolean;
};

const n = (x: number) => x.toLocaleString("en-PK");
const money = (u: Usage, c: Props["cost"]) => (c ? `≈ $${((u.inputTokens / 1e6) * c.inPerM + (u.outputTokens / 1e6) * c.outPerM).toFixed(2)}` : "");

/** AI chat transcripts + token usage so the owner can monitor quality and spend. */
export function ConversationsManager({ initial, usage, cost, ai, canDelete }: Props) {
  const [data, setData] = useState(initial);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<{ summary: ChatConversationSummary; messages: ChatMessageRow[] } | null>(null);
  const api = useApi();
  const pages = Math.max(1, Math.ceil(data.total / 20));

  const go = async (p: number) => {
    const res = await api.call<typeof initial>(`/api/admin/conversations?page=${p}`);
    if (res) { setData(res); setPage(p); }
  };
  const view = async (id: string) => {
    const res = await api.call<{ summary: ChatConversationSummary; messages: ChatMessageRow[] }>(`/api/admin/conversations/${id}`);
    if (res) setOpen(res);
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this conversation permanently?")) return;
    if (await api.call(`/api/admin/conversations/${id}`, { method: "DELETE" })) {
      setOpen(null);
      setData((d) => ({ total: d.total - 1, rows: d.rows.filter((r) => r.id !== id) }));
    }
  };

  const stats = [
    { label: "Chats today", value: n(usage.today.conversations), bg: "bg-lagoon-light" },
    { label: "Messages today", value: n(usage.today.messages), bg: "bg-mango-light" },
    { label: "Tokens today", value: `${n(usage.today.inputTokens + usage.today.outputTokens)}`, sub: money(usage.today, cost), bg: "bg-pista-light" },
    { label: "Tokens · 30 days", value: `${n(usage.month.inputTokens + usage.month.outputTokens)}`, sub: money(usage.month, cost), bg: "bg-ube-light" },
  ];

  return (
    <>
      <PageHeader title="AI chats" sub={ai.enabled ? `Assistant running on ${ai.provider} · ${ai.model}. Chats are kept for 30 days, then deleted automatically.` : "No AI key set — the free built-in assistant is answering. Add GOOGLE_GENERATIVE_AI_API_KEY to switch on Gemini."} />
      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-3xl border border-cocoa/10 p-4 ${s.bg}`}>
            <p className="text-xs font-bold text-cocoa-muted">{s.label}</p>
            <p className="mt-1 font-display text-2xl font-extrabold">{s.value}</p>
            {s.sub && <p className="text-xs text-cocoa-muted">{s.sub}</p>}
          </div>
        ))}
      </div>
      {api.error && <p role="alert" className="mb-4 rounded-2xl bg-berry-light px-4 py-3 text-sm font-bold text-berry-600">{api.error}</p>}
      <Panel>
        {data.rows.length === 0 ? (
          <Empty>No conversations yet. Open the website and ask the assistant something to see it here.</Empty>
        ) : (
          <ul className="divide-y divide-cocoa/10">
            {data.rows.map((c) => (
              <li key={c.id}>
                <button onClick={() => view(c.id)} className="flex w-full flex-wrap items-center gap-3 px-5 py-3 text-left text-sm hover:bg-cocoa/[0.03]">
                  <span className="min-w-0 flex-1 truncate font-bold">{c.firstMessage || "(no message)"}</span>
                  <span className="text-xs text-cocoa-muted">{c.messageCount} msgs · {n(c.inputTokens + c.outputTokens)} tokens</span>
                  <span className="w-20 text-right text-xs text-cocoa-muted">{timeAgo(c.updatedAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button disabled={page <= 1 || api.busy} onClick={() => go(page - 1)} className="btn-light !py-2 disabled:opacity-40">← Newer</button>
          <span>Page {page} of {pages}</span>
          <button disabled={page >= pages || api.busy} onClick={() => go(page + 1)} className="btn-light !py-2 disabled:opacity-40">Older →</button>
        </div>
      )}

      <Drawer
        open={!!open}
        onClose={() => setOpen(null)}
        title="Conversation"
        footer={open && canDelete ? <button onClick={() => remove(open.summary.id)} className="btn-ghost text-berry-600"><TrashIcon width={16} /> Delete conversation</button> : undefined}
      >
        {open && (
          <div className="space-y-3">
            <p className="text-xs text-cocoa-muted">Started {new Date(open.summary.createdAt).toLocaleString("en-PK", { timeZone: "Asia/Karachi" })} · {open.summary.messageCount} messages · {n(open.summary.inputTokens)} in / {n(open.summary.outputTokens)} out tokens</p>
            {open.messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex"}>
                <div className={clsx("max-w-[88%] rounded-2xl px-4 py-2.5 text-sm", m.role === "user" ? "rounded-br-md bg-cocoa text-vanilla" : "rounded-bl-md bg-white ring-1 ring-cocoa/10")}>
                  <p className="whitespace-pre-wrap">{m.content.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <Fragment key={i}>{p}</Fragment>))}</p>
                  {m.role === "assistant" && (
                    <p className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] text-cocoa-muted">
                      {m.source === "local" && <span className={badge("grey")}>built-in</span>}
                      {m.source === "error" && <span className={badge("red")}>fallback</span>}
                      {m.toolCalls.map((t, i) => <span key={i} className={badge("purple")}>{t.replace(/_/g, " ")}</span>)}
                      {m.inputTokens > 0 && <span>{n(m.inputTokens + m.outputTokens)} tokens</span>}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </>
  );
}
