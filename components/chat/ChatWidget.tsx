"use client";
import { Fragment, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useUI } from "@/components/providers/UIProvider";
import { useSite } from "@/components/providers/SiteProvider";
import { CloseIcon, SendIcon } from "@/components/ui/Icons";

type Msg = { role: "user" | "assistant"; content: string };
const STORE = "sip-scoop-chat-v2";

/** Renders **bold** and line breaks from the assistant. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => (part.startsWith("**") ? <strong key={j}>{part.slice(2, -2)}</strong> : <Fragment key={j}>{part}</Fragment>))}
        </Fragment>
      ))}
    </>
  );
}

/** Floating AI café assistant — talks to /api/chat (streams from Gemini/Claude/OpenAI when configured, built-in agent otherwise). */
export function ChatWidget() {
  const { chatOpen: open, setChatOpen: setOpen } = useUI();
  const { settings } = useSite();
  const starters = settings.aiStarters?.length ? settings.aiStarters : ["What's popular?", "Delivery charges?", "Timings?", "Something cold under Rs 500"];
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [chips, setChips] = useState<string[]>(starters);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const convRef = useRef<string>("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORE);
      if (saved) {
        const data = JSON.parse(saved);
        if (Array.isArray(data)) setMsgs(data);
        else {
          setMsgs(Array.isArray(data.msgs) ? data.msgs : []);
          convRef.current = typeof data.conversationId === "string" ? data.conversationId : "";
        }
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORE, JSON.stringify({ msgs: msgs.slice(-30), conversationId: convRef.current }));
    } catch {}
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: streaming ? "auto" : "smooth" });
  }, [msgs, busy, streaming]);
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 250);
  }, [open]);

  const clear = () => {
    setMsgs([]);
    convRef.current = "";
    setChips(starters);
  };

  async function send(text: string) {
    const q = text.trim().slice(0, 1000);
    if (!q || busy) return;
    setMsgs((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setBusy(true);
    const fail = `I couldn't connect just now. You can call us at ${settings.phone} or WhatsApp ${settings.whatsapp}.`;
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: q, conversationId: convRef.current || undefined }) });
      const conv = res.headers.get("X-Conversation-Id");
      if (conv) convRef.current = conv;

      if ((res.headers.get("Content-Type") ?? "").startsWith("text/plain") && res.body) {
        // streamed AI reply — show it word by word
        try {
          const next = JSON.parse(decodeURIComponent(res.headers.get("X-Suggestions") ?? "[]"));
          if (Array.isArray(next) && next.length) setChips(next);
        } catch {}
        setMsgs((m) => [...m, { role: "assistant", content: "" }]);
        setBusy(false);
        setStreaming(true);
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let acc = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += dec.decode(value, { stream: true });
          const now = acc;
          setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: now }]);
        }
        acc += dec.decode();
        const final = acc.trim() || fail;
        setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: final }]);
      } else {
        // built-in assistant / limits / validation errors
        const data = await res.json().catch(() => ({}));
        if (data.conversationId) convRef.current = data.conversationId;
        setMsgs((m) => [...m, { role: "assistant", content: data.reply ?? data.error ?? "Sorry, something went wrong." }]);
        if (data.suggestions?.length) setChips(data.suggestions);
      }
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: fail }]);
    } finally {
      setBusy(false);
      setStreaming(false);
    }
  }

  return (
    <>
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="focus-ring fixed bottom-4 right-4 z-[85] flex min-h-[52px] items-center gap-2.5 rounded-full bg-espresso py-1.5 pl-1.5 pr-5 text-vanilla shadow-card sm:bottom-6 sm:right-6"
        aria-expanded={open}
        aria-controls="chat-panel"
        aria-label={open ? "Close chat" : `Chat with ${settings.aiName}`}
      >
        <span className="relative grid h-10 w-10 place-items-center rounded-full bg-cherry-600 text-white">{open ? <CloseIcon width={18} /> : <span className="font-display text-xl italic">S</span>}{!open && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-espresso bg-mint" />}</span>
        <span className="text-[13px] uppercase tracking-[0.14em]">{open ? "Close" : `Ask ${settings.aiName}`}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.section
            id="chat-panel"
            role="dialog"
            aria-label={`${settings.aiName}, the ${settings.cafeName} assistant`}
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed inset-x-2 bottom-[80px] top-3 z-[84] flex flex-col overflow-hidden rounded-[28px] bg-vanilla shadow-card ring-1 ring-espresso/10 sm:inset-x-auto sm:bottom-24 sm:right-6 sm:top-auto sm:h-[580px] sm:w-[400px]"
          >
            <header className="flex items-center gap-3 bg-espresso px-4 py-3.5 text-vanilla">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-cherry-600 font-display text-2xl italic text-white">S</span>
              <div className="flex-1">
                <p className="font-display text-xl leading-none">{settings.aiName}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-latte-light/80"><span className="h-2 w-2 rounded-full bg-mint" /> Café concierge · replies instantly</p>
              </div>
              {msgs.length > 0 && (
                <button onClick={clear} className="focus-ring min-h-[36px] rounded-full px-3 text-xs uppercase tracking-[0.14em] text-latte-light hover:bg-white/10">Clear</button>
              )}
            </header>

            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4" data-lenis-prevent aria-live="polite">
              <Bubble role="assistant" text={settings.aiGreeting} />
              {msgs.map((m, i) => (m.content ? <Bubble key={i} role={m.role} text={m.content} /> : null))}
              {busy && (
                <div className="flex w-fit gap-1 rounded-2xl rounded-bl-md bg-latte-light px-4 py-3" aria-label="Typing">
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} className="h-2 w-2 rounded-full bg-cocoa/50" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }} />
                  ))}
                </div>
              )}
            </div>

            <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">
              {chips.map((c) => (
                <button key={c} onClick={() => send(c)} disabled={busy || streaming} className="focus-ring min-h-[36px] shrink-0 rounded-full border border-espresso/15 bg-white px-3.5 text-xs text-espresso hover:border-espresso">
                  {c}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-espresso/10 p-3"
            >
              <label htmlFor="chat-input" className="sr-only">Message</label>
              <input id="chat-input" ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} maxLength={1000} placeholder="Ask about menu, prices, delivery…" className="input !rounded-full !py-2.5" autoComplete="off" />
              <button type="submit" disabled={busy || streaming || !input.trim()} className="focus-ring grid h-12 w-12 shrink-0 place-items-center rounded-full bg-cherry-600 text-white disabled:opacity-40" aria-label="Send">
                <SendIcon width={18} />
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}

function Bubble({ role, text }: { role: "user" | "assistant"; text: string }) {
  const me = role === "user";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={me ? "flex justify-end" : "flex"}>
      <p className={me ? "max-w-[85%] rounded-2xl rounded-br-md bg-espresso px-4 py-2.5 text-[15px] text-vanilla" : "max-w-[90%] rounded-2xl rounded-bl-md bg-latte-light px-4 py-2.5 text-[15px] leading-relaxed"}>
        <Rich text={text} />
      </p>
    </motion.div>
  );
}
