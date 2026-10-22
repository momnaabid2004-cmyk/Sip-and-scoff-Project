import "server-only";
import { Resend } from "resend";
import { escapeHtml, siteUrl } from "@/lib/api";
import { formatPKR } from "@/lib/pricing";
import type { Enquiry, Message, Order } from "@/lib/db/types";

/**
 * Owner notifications through Resend (https://resend.com).
 * Needs RESEND_API_KEY, EMAIL_FROM (on a domain verified in Resend) and ALERT_EMAILS (comma-separated).
 * If they're missing, emails are skipped and a line is logged — the site keeps working.
 */
let client: Resend | null = null;
const resend = () => (process.env.RESEND_API_KEY ? (client ??= new Resend(process.env.RESEND_API_KEY)) : null);
const recipients = () => (process.env.ALERT_EMAILS ?? "").split(",").map((s) => s.trim()).filter(Boolean);

export const emailEnabled = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM && recipients().length);

async function send(subject: string, html: string, to = recipients()) {
  const r = resend();
  if (!r || !process.env.EMAIL_FROM || !to.length) {
    console.info(`[email] skipped (not configured): ${subject}`);
    return;
  }
  try {
    const { error } = await r.emails.send({ from: process.env.EMAIL_FROM, to, subject, html });
    if (error) console.error("[email] Resend error:", error.message);
  } catch (e) {
    console.error("[email] send failed:", (e as Error).message);
  }
}

const shell = (title: string, body: string, link?: { href: string; label: string }) => `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#2A1810">
  <h2 style="margin:0 0 12px">${escapeHtml(title)}</h2>
  ${body}
  ${link ? `<p style="margin-top:20px"><a href="${link.href}" style="background:#C2364A;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none">${escapeHtml(link.label)}</a></p>` : ""}
  <p style="color:#6B5446;font-size:12px;margin-top:24px">Sent automatically by your website.</p>
</div>`;
const row = (k: string, v: string) => (v ? `<tr><td style="padding:4px 12px 4px 0;color:#6B5446">${escapeHtml(k)}</td><td style="padding:4px 0">${escapeHtml(v)}</td></tr>` : "");

export function notifyNewOrder(o: Order) {
  const items = o.items.map((i) => `<li>${i.qty}× ${escapeHtml(i.name)}${i.options ? ` <span style="color:#6B5446">(${escapeHtml(i.options)})</span>` : ""} — ${formatPKR(i.unitPrice * i.qty)}</li>`).join("");
  const body = `<table>${row("Customer", o.customer.name)}${row("Phone", o.customer.phone)}${row("Email", o.customer.email)}${row("Type", o.type)}${row("Address", [o.customer.address, o.customer.area].filter(Boolean).join(", "))}${row("Payment", o.payment)}${row("Notes", o.customer.notes)}</table>
    <ul>${items}</ul><p><b>Total ${formatPKR(o.total)}</b> (delivery ${formatPKR(o.deliveryFee)})</p>`;
  return send(`🛎️ New order ${o.code} — ${formatPKR(o.total)}`, shell(`New order ${o.code}`, body, { href: `${siteUrl()}/admin/orders`, label: "Open orders board" }));
}

export function notifyNewMessage(m: Pick<Message, "name" | "email" | "phone" | "subject" | "message">) {
  const body = `<table>${row("From", m.name)}${row("Email", m.email)}${row("Phone", m.phone)}${row("Subject", m.subject)}</table><p style="white-space:pre-wrap">${escapeHtml(m.message)}</p>`;
  return send(`✉️ New message from ${m.name}`, shell("New contact message", body, { href: `${siteUrl()}/admin/messages`, label: "Open inbox" }));
}

export function notifyNewEnquiry(e: Enquiry) {
  const body = `<table>${row("Type", e.type)}${row("Name", e.name)}${row("Phone", e.phone)}${row("Email", e.email)}${row("Date", e.date)}${row("Time", e.time)}${row("Guests", e.guests ? String(e.guests) : "")}</table><p style="white-space:pre-wrap">${escapeHtml(e.details)}</p>`;
  return send(`📅 New ${e.type} request from ${e.name}`, shell("New request from the AI assistant", body, { href: `${siteUrl()}/admin/enquiries`, label: "Open requests" }));
}
