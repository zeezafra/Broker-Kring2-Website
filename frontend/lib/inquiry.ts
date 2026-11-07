import { broker } from "./broker";

// Phase 10: everything the public inquiry form needs besides the markup.

/** The listing an inquiry is about (set when the form is opened from a listing page). */
export type InquiryProperty = { id: number; title: string };

// DRAFT WORDING: a plain description of what the form really does with the visitor's details. It is NOT
// legal text. Marie Chris and Zee must confirm or replace it before the site goes public (HANDOFF, Phase 10).
// Do not add promises about retention, sharing or security here unless the broker confirms them.
export const CONSENT_TEXT =
  "I agree that Marie Chris L. Tagsip may use my name, phone number and email to reply to this inquiry.";

export type InquiryInput = {
  name: string;
  phone: string;
  email: string;
  message: string;
  consent: boolean;
  /** Honeypot: hidden from people, so it must stay empty. Named so browser autofill won't touch it. */
  hp_extra: string;
  propertyId?: number;
  /** Phase 11: set by the /sell form. Makes it a sell/appraisal inquiry instead of a general one. */
  service?: "SELL" | "APPRAISAL";
  /** Phase 11: where the property is (required by the API when `service` is set). */
  propertyLocation?: string;
};

export type SendResult = { ok: true } | { ok: false; error: string };

const CALL_US = `or call ${broker.phone.display}`;

// Goes to /api/inquiries on THIS site; Next forwards it to the Render API (same rewrite the admin uses).
// The timeout is generous because the free Render tier can take close to a minute to wake up.
export async function sendInquiry(input: InquiryInput): Promise<SendResult> {
  let res: Response;
  try {
    res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    return { ok: false, error: `We couldn’t send your inquiry. Check your connection and try again, ${CALL_US}.` };
  }
  if (res.ok) return { ok: true };

  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  // 400 and 429 carry a message written for the visitor; anything else is on our side.
  if ((res.status === 400 || res.status === 429) && body?.error) return { ok: false, error: body.error };
  return { ok: false, error: `Something went wrong on our side. Please try again in a moment, ${CALL_US}.` };
}
