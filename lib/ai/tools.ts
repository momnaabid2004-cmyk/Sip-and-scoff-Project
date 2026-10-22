import "server-only";
import { tool } from "ai";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimited } from "@/lib/api";
import { normalizePkPhone } from "@/lib/phone";
import { notifyNewEnquiry } from "@/lib/email";

/**
 * Actions the assistant may take. Every input is validated with Zod, and each tool is rate-limited
 * per conversation so it can't be abused (e.g. guessing order numbers).
 */
export function createTools(opts: { conversationId: string; ipHash: string }) {
  const { conversationId, ipHash } = opts;

  return {
    check_order_status: tool({
      description:
        "Look up the live status of a customer's order. Requires BOTH the order number (like SS-1001) and the mobile number used at checkout. Only call this when the customer has given both.",
      inputSchema: z.object({
        orderCode: z.string().min(3).max(20).describe("Order number, e.g. SS-1001"),
        phone: z.string().min(10).max(20).describe("Pakistani mobile number used at checkout, e.g. 03001234567"),
      }),
      execute: async ({ orderCode, phone }) => {
        if ((await rateLimited(`ai-track:${conversationId}`, 5, 60 * 60 * 1000)) || (await rateLimited(`ai-track-ip:${ipHash}`, 15, 60 * 60 * 1000)))
          return { found: false, error: "Too many lookups. Ask the customer to use the Track order page or WhatsApp the café." };
        const o = await db.orders.track(orderCode, phone);
        if (!o) return { found: false, error: "No order matches that number AND mobile number. Ask the customer to double-check both." };
        return {
          found: true,
          code: o.code,
          status: o.status, // new | confirmed | preparing | on-the-way | completed | cancelled
          type: o.type,
          placedAt: o.createdAt,
          items: o.items.map((i) => `${i.qty}× ${i.name}${i.options ? ` (${i.options})` : ""}`),
          total: o.total,
          payment: o.payment,
          updates: o.timeline,
        };
      },
    }),

    create_enquiry: tool({
      description:
        "Save a request for the café team: table booking, catering, event, birthday cake, call-back or other. Only call AFTER the customer has confirmed the details you repeated back to them.",
      inputSchema: z.object({
        type: z.enum(["table", "catering", "event", "cake", "callback", "other"]),
        name: z.string().trim().min(2).max(60),
        phone: z.string().trim().min(10).max(20).describe("Pakistani mobile number"),
        email: z.string().trim().email().max(120).optional(),
        date: z.string().trim().max(40).optional().describe("As the customer said it, e.g. 'Saturday' or '25 October'"),
        time: z.string().trim().max(40).optional(),
        guests: z.number().int().min(1).max(1000).optional(),
        details: z.string().trim().min(3).max(600).describe("What they need, in a sentence or two"),
      }),
      execute: async (input) => {
        const phone = normalizePkPhone(input.phone);
        if (!phone) return { saved: false, error: "That mobile number doesn't look valid. Ask for a Pakistani mobile number like 0300 1234567." };
        if (await rateLimited(`ai-enquiry:${conversationId}`, 3, 24 * 60 * 60 * 1000))
          return { saved: false, error: "Several requests were already saved in this chat. Ask the customer to WhatsApp the café for more." };
        const e = await db.enquiries.create({
          type: input.type,
          name: input.name,
          phone,
          email: input.email ?? "",
          date: input.date ?? "",
          time: input.time ?? "",
          guests: input.guests ?? null,
          details: input.details,
          source: "chat",
          conversationId,
        });
        await notifyNewEnquiry(e).catch(() => {});
        return { saved: true, reference: e.id.slice(-6).toUpperCase(), note: "Tell the customer the team will call or WhatsApp them to confirm. It is NOT confirmed yet." };
      },
    }),
  };
}

export type CafeTools = ReturnType<typeof createTools>;
