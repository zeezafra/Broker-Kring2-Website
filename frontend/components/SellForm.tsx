"use client";

import { useState, type FormEvent } from "react";
import { CONSENT_TEXT, sendInquiry } from "@/lib/inquiry";
import { sellPage } from "@/lib/sell";

type Phase = "form" | "sending" | "sent";
type Service = keyof typeof sellPage.options;

// Phase 11: the /sell inquiry form. Same endpoint, consent line and honeypot as the modal (Phase 10), plus
// "what do you want" and "where is the property". Saved as a SELL_APPRAISAL inquiry in the admin inbox.
export default function SellForm() {
  const [phase, setPhase] = useState<Phase>("form");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (phase === "sending") return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const text = (key: string) => String(fd.get(key) ?? "");
    const service = text("service");

    setPhase("sending");
    setError(null);
    const result = await sendInquiry({
      name: text("name"),
      phone: text("phone"),
      email: text("email"),
      message: text("message"),
      consent: fd.get("consent") === "on",
      hp_extra: text("hp_extra"),
      service: service === "SELL" || service === "APPRAISAL" ? service : undefined,
      propertyLocation: text("propertyLocation"),
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
    <form id="sellForm" onSubmit={onSubmit}>
      <fieldset className="sell-choice">
        <legend>What would you like to do?</legend>
        {(Object.keys(sellPage.options) as Service[]).map((key) => (
          <label key={key} className="sell-option">
            <input type="radio" name="service" value={key} required />
            <span>
              <strong>{sellPage.options[key].label}</strong>
              <small>{sellPage.options[key].hint}</small>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="form-field">
        <label htmlFor="sell-location">{sellPage.locationLabel}</label>
        <input
          id="sell-location"
          name="propertyLocation"
          required
          minLength={3}
          maxLength={150}
          autoComplete="off"
          placeholder={sellPage.locationPlaceholder}
        />
      </div>
      <div className="form-field">
        <label htmlFor="sell-name">Name</label>
        <input id="sell-name" name="name" required minLength={2} maxLength={100} autoComplete="name" placeholder="Your name" />
      </div>
      <div className="form-field">
        <label htmlFor="sell-phone">Phone</label>
        <input id="sell-phone" name="phone" type="tel" inputMode="tel" required maxLength={30} autoComplete="tel" placeholder="+63" />
      </div>
      <div className="form-field">
        <label htmlFor="sell-email">Email</label>
        <input id="sell-email" name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com" />
      </div>
      <div className="form-field">
        <label htmlFor="sell-message">Message</label>
        <textarea id="sell-message" name="message" required minLength={5} maxLength={2000} placeholder={sellPage.messagePlaceholder} />
      </div>
      {/* Honeypot: invisible to people, tempting to bots. The API drops any inquiry that fills it. */}
      <div className="hp" aria-hidden="true">
        <label htmlFor="sell-hp">Leave this empty</label>
        <input id="sell-hp" name="hp_extra" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="form-check">
        <input id="sell-consent" name="consent" type="checkbox" required />
        <label htmlFor="sell-consent">{CONSENT_TEXT}</label>
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
