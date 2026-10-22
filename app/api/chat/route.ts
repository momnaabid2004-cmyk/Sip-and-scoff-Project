import { NextResponse } from "next/server";
import { z } from "zod";
import type { ModelMessage } from "ai";
import { db } from "@/lib/db";
import { loadContext } from "@/lib/ai/context";
import { localAgent } from "@/lib/ai/local-agent";
import { buildSystemPrompt } from "@/lib/ai/prompt";
import { createTools } from "@/lib/ai/tools";
import { streamTurn } from "@/lib/ai/agent";
import { getModel } from "@/lib/ai/provider";
import { clientIp, hashIp, parseBody, rateLimited } from "@/lib/api";

export const maxDuration = 30; // seconds (Vercel)

const schema = z.object({
  message: z.string().trim().min(1, "Type a message first").max(1000, "Please keep messages under 1,000 characters"),
  conversationId: z.string().max(40).optional().nullable(),
});

const HISTORY_TURNS = 12; // memory: last 12 messages of this conversation
const PER_IP_10MIN = Number(process.env.AI_RATE_LIMIT_PER_10MIN ?? 20);
const PER_IP_DAY = Number(process.env.AI_RATE_LIMIT_PER_DAY ?? 150);
const GLOBAL_DAY = Number(process.env.AI_DAILY_MESSAGE_LIMIT ?? 3000);

const json = (body: unknown, status = 200, conversationId?: string) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...(conversationId ? { "X-Conversation-Id": conversationId } : {}) } });

/**
 * Café assistant.
 * Request:  { message, conversationId? }   (history is loaded from the database — the browser can't forge past turns)
 * Response: streamed text/plain from the AI (headers: X-Conversation-Id, X-Suggestions),
 *           or JSON { reply, suggestions, conversationId, source } from the built-in assistant (no API key / limits / errors).
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  const ipHash = hashIp(ip);
  if ((await rateLimited(`chat10:${ipHash}`, PER_IP_10MIN, 10 * 60 * 1000)) || (await rateLimited(`chatday:${ipHash}`, PER_IP_DAY, 24 * 60 * 60 * 1000)))
    return json({ reply: "You're chatting fast! Give me a minute and ask again 🙂", suggestions: [], source: "limit" }, 429);

  const body = await parseBody(req, schema);
  if (body.error) return body.error;
  const { message } = body.data;

  const ctx = await loadContext();
  const local = localAgent(message, ctx);

  // conversation + memory (only the server's own record of the chat is trusted)
  let conversationId = body.data.conversationId ?? "";
  if (!conversationId || !(await db.chat.exists(conversationId))) {
    conversationId = await db.chat.createConversation({ ipHash, userAgent: req.headers.get("user-agent") ?? "" });
  }
  const history = await db.chat.history(conversationId, HISTORY_TURNS);
  await db.chat.addMessage(conversationId, { role: "user", content: message, source: "", model: "", toolCalls: [], inputTokens: 0, outputTokens: 0 });

  const saveLocal = async (reply: string, source: string) => {
    await db.chat.addMessage(conversationId, { role: "assistant", content: reply, source, model: "built-in", toolCalls: [], inputTokens: 0, outputTokens: 0 });
    return json({ reply, suggestions: local.suggestions, conversationId, source }, 200, conversationId);
  };

  const ai = getModel();
  if (!ai) return saveLocal(local.reply, "local");

  // global daily budget guard — beyond it the free built-in assistant answers
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  if ((await db.chat.userMessagesSince(since)) > GLOBAL_DAY) return saveLocal(local.reply, "local");

  const messages: ModelMessage[] = [
    ...history.filter((m) => m.content.trim()).map((m) => ({ role: m.role, content: m.content }) as ModelMessage),
    { role: "user", content: message },
  ];

  const fallback = `${local.reply}\n\n(I'm having a little trouble right now — for anything else, WhatsApp us at ${ctx.settings.whatsapp}.)`;
  const stream = streamTurn({
    model: ai.model,
    system: buildSystemPrompt(ctx),
    messages,
    tools: createTools({ conversationId, ipHash }),
    fallbackText: fallback,
    onComplete: async (r) => {
      await db.chat.addMessage(conversationId, {
        role: "assistant",
        content: r.text,
        source: r.source,
        model: ai.id,
        toolCalls: r.toolCalls,
        inputTokens: r.inputTokens,
        outputTokens: r.outputTokens,
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Conversation-Id": conversationId,
      "X-Suggestions": encodeURIComponent(JSON.stringify(local.suggestions)),
    },
  });
}
