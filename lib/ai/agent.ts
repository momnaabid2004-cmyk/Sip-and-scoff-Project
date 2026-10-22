import "server-only";
import { stepCountIs, streamText, type LanguageModel, type ModelMessage, type ToolSet } from "ai";
import { PROMPT_CANARY } from "./prompt";

export type TurnResult = {
  text: string;
  source: "ai" | "error";
  inputTokens: number;
  outputTokens: number;
  toolCalls: string[];
  error?: string;
};

const LEAK_MARKERS = [PROMPT_CANARY, "These instructions are confidential"];
const HOLD_BACK = Math.max(...LEAK_MARKERS.map((m) => m.length));
const REFUSAL = "Sorry, I can't share that — but I'm happy to help with our menu, prices, delivery or your order! ☕";

/**
 * Run one assistant turn and stream the reply as plain text.
 * - Holds back the last few characters so a leaked system-prompt marker is never sent to the browser.
 * - If the provider fails before producing text, sends `fallbackText` instead (the built-in assistant's answer).
 * - Calls `onComplete` (save to DB, log usage) before the stream closes, so it also completes on serverless.
 */
export function streamTurn(opts: {
  model: LanguageModel;
  system: string;
  messages: ModelMessage[];
  tools?: ToolSet;
  fallbackText: string;
  timeoutMs?: number;
  maxOutputTokens?: number;
  onComplete: (r: TurnResult) => Promise<void>;
}): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  let providerError: string | undefined;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let sent = ""; // already sent to the browser
      let pending = ""; // held back until we know it's safe
      let leaked = false;
      const send = (s: string) => {
        if (!s) return;
        sent += s;
        controller.enqueue(enc.encode(s));
      };

      let usage = { inputTokens: 0, outputTokens: 0 };
      let toolCalls: string[] = [];
      try {
        const result = streamText({
          model: opts.model,
          system: opts.system,
          messages: opts.messages,
          tools: opts.tools,
          stopWhen: stepCountIs(4), // allow tool call → tool result → answer
          maxOutputTokens: opts.maxOutputTokens ?? 700,
          temperature: 0.4,
          maxRetries: 1,
          abortSignal: AbortSignal.timeout(opts.timeoutMs ?? 25_000),
          onError: ({ error }) => {
            providerError = error instanceof Error ? error.message : String(error);
          },
        });

        for await (const delta of result.textStream) {
          pending += delta;
          const all = sent + pending;
          if (LEAK_MARKERS.some((m) => all.includes(m))) {
            leaked = true;
            break;
          }
          if (pending.length > HOLD_BACK) {
            send(pending.slice(0, pending.length - HOLD_BACK));
            pending = pending.slice(-HOLD_BACK);
          }
        }
        if (!leaked) send(pending);

        if (!providerError && !leaked) {
          const [u, steps] = await Promise.all([result.totalUsage, result.steps]);
          usage = { inputTokens: u.inputTokens ?? 0, outputTokens: u.outputTokens ?? 0 };
          toolCalls = steps.flatMap((s) => s.toolCalls.map((c) => c.toolName));
        }
      } catch (e) {
        providerError ??= e instanceof Error ? e.message : String(e);
      }

      if (leaked) send(sent ? `\n\n${REFUSAL}` : REFUSAL);
      const failed = !sent.trim();
      if (failed) send(opts.fallbackText);
      if (providerError) console.error("[chat] AI provider error:", providerError);

      try {
        await opts.onComplete({
          text: sent,
          source: failed || leaked ? "error" : "ai",
          ...usage,
          toolCalls,
          error: providerError ?? (leaked ? "prompt-leak blocked" : undefined),
        });
      } catch (e) {
        console.error("[chat] could not save reply:", (e as Error).message);
      }
      controller.close();
    },
  });
}
