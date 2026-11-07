import { InquiryService } from "./generated/prisma/enums";

// Email notification for new inquiries, sent through Resend (https://resend.com).
// It calls Resend's REST API with fetch, so there is no new npm dependency.
//
// Rules this file follows:
//  - The inquiry is ALREADY saved in the database before this runs. An email problem must never lose or
//    block a lead, so every failure is caught and only logged.
//  - If RESEND_API_KEY or INQUIRY_NOTIFY_TO is missing, nothing is sent (the admin inbox still works).
//  - Visitor text is HTML-escaped before it goes into the email body, and line breaks are removed from the
//    subject, so a visitor cannot inject markup or extra headers.
//  - Logs never contain the visitor's name, phone, email or message.

export type NotifyInquiry = {
  id: number;
  name: string;
  phone: string;
  email: string;
  message: string;
  propertyTitle: string | null;
  service: InquiryService | null;
  propertyLocation: string | null;
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

function recipients(): string[] {
  return (process.env.INQUIRY_NOTIFY_TO ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY) && recipients().length > 0;

function kindOf(i: NotifyInquiry): string {
  if (i.service === InquiryService.SELL) return "Wants to sell";
  if (i.service === InquiryService.APPRAISAL) return "Wants an appraisal";
  if (i.propertyTitle) return `About: ${i.propertyTitle}`;
  return "General inquiry";
}

export async function notifyNewInquiry(i: NotifyInquiry): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const to = recipients();
  if (!key || to.length === 0) return;

  // Until a domain is verified in Resend, only "onboarding@resend.dev" works (and only to the account owner).
  const from = process.env.INQUIRY_FROM?.trim() || "Cebu Properties by MCT <onboarding@resend.dev>";
  const kind = kindOf(i);

  const rows: [string, string][] = [
    ["Type", kind],
    ["Name", i.name],
    ["Phone", i.phone],
    ["Email", i.email],
  ];
  if (i.propertyLocation) rows.push(["Property location", i.propertyLocation]);

  const text = [...rows.map(([k, v]) => `${k}: ${v}`), "", "Message:", i.message, "", "Reply to this email to answer the visitor."].join("\n");
  const html =
    `<div style="font-family:Arial,sans-serif;font-size:15px;color:#17171b;line-height:1.5">` +
    `<h2 style="margin:0 0 12px;font-size:18px">New inquiry</h2>` +
    `<table cellpadding="4" style="border-collapse:collapse">` +
    rows.map(([k, v]) => `<tr><td style="color:#5f5d57;padding-right:12px;vertical-align:top">${esc(k)}</td><td>${esc(v)}</td></tr>`).join("") +
    `</table>` +
    `<p style="margin:16px 0 4px;color:#5f5d57">Message</p>` +
    `<p style="margin:0;white-space:pre-wrap">${esc(i.message)}</p>` +
    `<p style="margin:20px 0 0;color:#5f5d57;font-size:13px">Reply to this email to answer the visitor. All inquiries are also in the admin inbox.</p>` +
    `</div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to,
        reply_to: i.email,
        subject: oneLine(`New inquiry: ${kind} (${i.name})`).slice(0, 200),
        text,
        html,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      // Resend's error body describes the problem (bad key, unverified domain...) and holds no visitor data.
      const detail = (await res.text().catch(() => "")).slice(0, 300);
      console.warn(`[notify] Resend refused the email for inquiry #${i.id} (HTTP ${res.status}): ${detail}`);
    }
  } catch (err) {
    console.warn(`[notify] Could not reach Resend for inquiry #${i.id}: ${err instanceof Error ? err.message : "unknown error"}`);
  }
}
