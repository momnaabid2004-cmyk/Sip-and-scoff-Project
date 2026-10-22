import "server-only";
import type { LanguageModel } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";

/**
 * Provider-agnostic model selection (Vercel AI SDK). Switch provider with .env only:
 *   AI_PROVIDER=google    + GOOGLE_GENERATIVE_AI_API_KEY   (default — Gemini)
 *   AI_PROVIDER=anthropic + ANTHROPIC_API_KEY
 *   AI_PROVIDER=openai    + OPENAI_API_KEY
 *   AI_MODEL=<model id>   optional — overrides the default model for that provider
 */
export type AiProvider = "google" | "anthropic" | "openai";

const DEFAULT_MODEL: Record<AiProvider, string> = {
  google: "gemini-3.8-flash",
  anthropic: "claude-haiku-5-5",
  openai: "gpt-5-mini",
};
const KEY_VAR: Record<AiProvider, string> = {
  google: "GOOGLE_GENERATIVE_AI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
};

export function aiConfig() {
  const raw = (process.env.AI_PROVIDER ?? "google").toLowerCase();
  const provider: AiProvider = raw === "anthropic" || raw === "openai" ? raw : "google";
  const keyVar = KEY_VAR[provider];
  // Gemini keys are also commonly saved as GEMINI_API_KEY — accept both
  const apiKey = process.env[keyVar] || (provider === "google" ? process.env.GEMINI_API_KEY : undefined) || "";
  const model = process.env.AI_MODEL?.trim() || (provider === "google" ? process.env.GEMINI_MODEL?.trim() : "") || DEFAULT_MODEL[provider];
  return { provider, model, keyVar, enabled: apiKey.length > 0, apiKey };
}

/** The configured language model, or null when no API key is set (the built-in assistant answers instead). */
export function getModel(): { model: LanguageModel; id: string } | null {
  const c = aiConfig();
  if (!c.enabled) return null;
  switch (c.provider) {
    case "anthropic":
      return { model: createAnthropic({ apiKey: c.apiKey })(c.model), id: `anthropic/${c.model}` };
    case "openai":
      return { model: createOpenAI({ apiKey: c.apiKey })(c.model), id: `openai/${c.model}` };
    default:
      return { model: createGoogleGenerativeAI({ apiKey: c.apiKey })(c.model), id: `google/${c.model}` };
  }
}
