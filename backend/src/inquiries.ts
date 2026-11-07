import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { InquiryService, InquiryType, PropertyStatus } from "./generated/prisma/enums";
import { checkOrigin } from "./auth";
import { prisma } from "./db";
import { notifyNewInquiry } from "./notify";

// Phase 10: the PUBLIC lead form endpoint. It only ever writes; it never returns inquiry data.
// Reading, status changes and deletes live in admin.ts behind requireAdmin.
export const inquiriesRouter = Router();

// ---- limits ----------------------------------------------------------------------------------

export const LIMITS = { nameMin: 2, nameMax: 100, emailMax: 254, messageMin: 5, messageMax: 2000, locationMin: 3, locationMax: 150 };

// Digits, spaces and the usual + ( ) - . separators; 7 to 20 digits so "+63 936 948 0702" and
// local numbers both pass but obvious junk does not.
const PHONE_CHARS = /^[+\d][\d\s().-]{4,29}$/;
// Deliberately simple: one @, something on each side, a dot in the domain, no spaces.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---- abuse protection (in memory; fine for one Render instance, resets on restart) ----------

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_IP = 5; // a real visitor rarely sends more than one or two
const MAX_TOTAL = 60; // safety net for the whole site per window, in case IPs are hidden behind a proxy
const perIp = new Map<string, { count: number; resetAt: number }>();
let total = { count: 0, resetAt: Date.now() + WINDOW_MS };

function hit(map: Map<string, { count: number; resetAt: number }>, key: string, max: number): boolean {
  const now = Date.now();
  const entry = map.get(key);
  if (!entry || entry.resetAt < now) {
    map.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > max;
}

function isThrottled(ip: string): boolean {
  const now = Date.now();
  if (total.resetAt < now) total = { count: 0, resetAt: now + WINDOW_MS };
  total.count += 1;
  const ipBlocked = hit(perIp, ip, MAX_PER_IP);
  // Keep the map from growing forever.
  if (perIp.size > 5000) for (const [k, v] of perIp) if (v.resetAt < now) perIp.delete(k);
  return ipBlocked || total.count > MAX_TOTAL;
}

// ---- validation ------------------------------------------------------------------------------

type Clean = {
  name: string;
  phone: string;
  email: string;
  message: string;
  propertyId: number | null;
  // Phase 11: set only for inquiries from the /sell page.
  service: InquiryService | null;
  propertyLocation: string | null;
};

// Collapse runs of whitespace in single-line fields so " Juan   Dela Cruz " is stored tidily.
const oneLine = (v: string) => v.replace(/\s+/g, " ").trim();

export function parseInquiry(body: unknown): { ok: true; data: Clean } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "Send the inquiry as a JSON object" };
  }
  const b = body as Record<string, unknown>;
  const str = (k: string) => (typeof b[k] === "string" ? (b[k] as string) : "");

  const name = oneLine(str("name"));
  if (name.length < LIMITS.nameMin || name.length > LIMITS.nameMax) {
    return { ok: false, error: `Enter your name (${LIMITS.nameMin}-${LIMITS.nameMax} characters)` };
  }

  const phone = oneLine(str("phone"));
  const digits = phone.replace(/\D/g, "").length;
  if (!PHONE_CHARS.test(phone) || digits < 7 || digits > 20) {
    return { ok: false, error: "Enter a phone number we can reach you on, for example +63 936 948 0702" };
  }

  const email = str("email").trim();
  if (email.length > LIMITS.emailMax || !EMAIL.test(email)) {
    return { ok: false, error: "Enter a valid email address" };
  }

  // Keep the visitor's line breaks, only trim the ends and cap blank-line runs.
  const message = str("message").replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (message.length < LIMITS.messageMin || message.length > LIMITS.messageMax) {
    return { ok: false, error: `Write a short message (${LIMITS.messageMin}-${LIMITS.messageMax} characters)` };
  }

  if (b.consent !== true) {
    return { ok: false, error: "Please tick the consent box so we can contact you about this inquiry" };
  }

  // Phase 11: `service` marks a /sell inquiry. It needs to say where the property is (an appraiser cannot
  // answer without it) and it is never tied to a listing.
  let service: InquiryService | null = null;
  let propertyLocation: string | null = null;
  if (b.service !== undefined && b.service !== null) {
    if (b.service !== InquiryService.SELL && b.service !== InquiryService.APPRAISAL) {
      return { ok: false, error: "Choose whether you want to sell or request an appraisal" };
    }
    service = b.service;
    propertyLocation = oneLine(str("propertyLocation"));
    if (propertyLocation.length < LIMITS.locationMin || propertyLocation.length > LIMITS.locationMax) {
      return { ok: false, error: "Tell us where the property is (a town, barangay or address)" };
    }
  }

  let propertyId: number | null = null;
  if (!service && b.propertyId !== undefined && b.propertyId !== null) {
    const n = b.propertyId;
    if (typeof n !== "number" || !Number.isInteger(n) || n < 1 || n > 2_147_483_647) {
      return { ok: false, error: "That listing is not valid" };
    }
    propertyId = n;
  }

  return { ok: true, data: { name, phone, email, message, propertyId, service, propertyLocation } };
}

// ---- route -----------------------------------------------------------------------------------

// POST /api/inquiries  { name, phone, email, message, consent: true, propertyId?, service?, propertyLocation?, hp_extra? }
//   `service` ("SELL" | "APPRAISAL") + `propertyLocation` come from the /sell page and make it a SELL_APPRAISAL inquiry.
//   -> 201 { ok: true }
// `hp_extra` is a honeypot: a hidden field no person fills in. A bot that does gets a normal-looking
// success and nothing is saved.
inquiriesRouter.post("/", checkOrigin, async (req: Request, res: Response, _next: NextFunction) => {
  if (typeof req.body?.hp_extra === "string" && req.body.hp_extra.trim() !== "") {
    return res.status(201).json({ ok: true });
  }

  const parsed = parseInquiry(req.body);
  if (!parsed.ok) return res.status(400).json({ error: parsed.error });
  const d = parsed.data;

  // Link the listing only if it is live. A visitor who was looking at a listing that was unpublished
  // a minute ago still gets their inquiry saved, just as a general one: never lose a lead.
  let property: { id: number; title: string } | null = null;
  if (d.propertyId) {
    const found = await prisma.property.findUnique({
      where: { id: d.propertyId },
      select: { id: true, title: true, status: true },
    });
    if (found && found.status !== PropertyStatus.DRAFT) property = { id: found.id, title: found.title };
  }

  // A double click or a retry after a slow response sends the same inquiry twice: save it once.
  const since = new Date(Date.now() - 10 * 60 * 1000);
  const duplicate = await prisma.inquiry.findFirst({
    where: { email: d.email, message: d.message, propertyId: property?.id ?? null, service: d.service, createdAt: { gte: since } },
    select: { id: true },
  });
  if (duplicate) return res.status(201).json({ ok: true });

  // Throttle only inquiries that would really be saved. Counting typos and double clicks would lock out
  // a real visitor who is simply fixing a phone number.
  if (isThrottled(req.ip ?? "unknown")) {
    return res.status(429).json({ error: "Too many inquiries from this connection. Please try again in a few minutes." });
  }

  const saved = await prisma.inquiry.create({
    data: {
      type: d.service ? InquiryType.SELL_APPRAISAL : property ? InquiryType.LISTING : InquiryType.GENERAL,
      name: d.name,
      phone: d.phone,
      email: d.email,
      message: d.message,
      propertyId: property?.id ?? null,
      propertyTitle: property?.title ?? null,
      service: d.service,
      propertyLocation: d.propertyLocation,
      consentAt: new Date(),
    },
  });
  res.status(201).json({ ok: true });

  // Email Marie Chris (Resend). Runs AFTER the response, never awaited by the visitor, and never throws:
  // the lead is already saved, so an email problem can only cost the notification.
  void notifyNewInquiry({
    id: saved.id,
    name: saved.name,
    phone: saved.phone,
    email: saved.email,
    message: saved.message,
    propertyTitle: saved.propertyTitle,
    service: saved.service,
    propertyLocation: saved.propertyLocation,
  });
});
