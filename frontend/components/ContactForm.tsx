"use client";

import { useState, type FormEvent } from "react";
import { CONSENT_TEXT, sendInquiry } from "@/lib/inquiry";
import { contactPage } from "@/lib/contact";

type Phase = "form" | "sending" | "sent";

// Phase 12: the /contact inquiry form. Same endpoint, consent line and honeypot as the modal (Phase 10);
// no `service`, so it is saved as a GENERAL inquiry in the admin inbox.
export default function ContactForm() {
  const [phase, setPhase] = useState<Phase>("form");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (phase === "sending") return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const text = (key: string) => String(fd.get(key) ?? "");

    setPhase("sending");
    setError(null);
    const result = await sendInquiry({
      name: text("name"),
      phone: text("phone"),
      email: text("email"),
      message: text("message"),
      consent: fd.get("consent") === "on",
      hp_extra: text("hp_extra"),
    });

    if (result.ok) {
      form.reset();
      setPhase("sent");
    } else {
      // Keep everything the visitor typed so they can fix it or retry.
      setError(result.error);
      setPhase("form");
    }
  }

  if (phase === "sent") {
    return (
      <div className="sell-sent" role="status">
        <div className="check">✓</div>
        <h2>Thank you!</h2>
        <p>Your inquiry has been sent to Marie Chris L. Tagsip.</p>
        <button className="gold-btn" type="button" onClick={() => setPhase("form")}>
          Send another inquiry
        </button>
      </div>
    );
  }

  const sending = phase === "sending";
  return (
    <form id="contactForm" onSubmit={onSubmit}>
      <div className="form-field">
        <label htmlFor="contact-name">Name</label>
        <input id="contact-name" name="name" required minLength={2} maxLength={100} autoComplete="name" placeholder="Your name" />
      </div>
      <div className="form-field">
        <label htmlFor="contact-phone">Phone</label>
        <input id="contact-phone" name="phone" type="tel" inputMode="tel" required maxLength={30} autoComplete="tel" placeholder="+63" />
      </div>
      <div className="form-field">
        <label htmlFor="contact-email">Email</label>
        <input id="contact-email" name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com" />
      </div>
      <div className="form-field">
        <label htmlFor="contact-message">Message</label>
        <textarea id="contact-message" name="message" required minLength={5} maxLength={2000} placeholder={contactPage.messagePlaceholder} />
      </div>
      {/* Honeypot: invisible to people, tempting to bots. The API drops any inquiry that fills it. */}
      <div className="hp" aria-hidden="true">
        <label htmlFor="contact-hp">Leave this empty</label>
        <input id="contact-hp" name="hp_extra" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="form-check">
        <input id="contact-consent" name="consent" type="checkbox" required />
        <label htmlFor="contact-consent">{CONSENT_TEXT}</label>
      </div>
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      <button className="gold-btn" type="submit" disabled={sending}>
        {sending ? "Sending…" : "Send Inquiry"}
      </button>
    </form>
  );
}
