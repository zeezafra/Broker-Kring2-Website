"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { CONSENT_TEXT, sendInquiry, type InquiryProperty } from "@/lib/inquiry";

type InquiryContextValue = {
  /** General inquiry (header, home page buttons). Safe to use directly as an onClick handler. */
  open: () => void;
  /** Inquiry about one listing (detail page button). */
  openForListing: (property: InquiryProperty) => void;
};

const InquiryContext = createContext<InquiryContextValue | null>(null);

export function useInquiry() {
  const ctx = useContext(InquiryContext);
  if (!ctx) throw new Error("useInquiry must be used inside <InquiryProvider>");
  return ctx;
}

type Phase = "form" | "sending" | "sent";

// The HTML's modal (open/close, Escape, backdrop click, scroll lock) with a real form behind it (Phase 10):
// the inquiry is saved by the API and shows up in /admin/inquiries.
export function InquiryProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("form");
  const [error, setError] = useState<string | null>(null);
  const [property, setProperty] = useState<InquiryProperty | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  // The element that opened the dialog, so keyboard focus goes back to it on close.
  const openerRef = useRef<HTMLElement | null>(null);

  const show = useCallback((p: InquiryProperty | null) => {
    if (document.activeElement instanceof HTMLElement) openerRef.current = document.activeElement;
    setProperty(p);
    // A finished inquiry must not greet the next visitor action with "Thank you" again.
    setPhase((current) => (current === "sent" ? "form" : current));
    setError(null);
    setIsOpen(true);
  }, []);
  const open = useCallback(() => show(null), [show]);
  const openForListing = useCallback((p: InquiryProperty) => show(p), [show]);
  const close = useCallback(() => setIsOpen(false), []);
  const value = useMemo(() => ({ open, openForListing }), [open, openForListing]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Phase 13 (accessibility): focus moves into the dialog when it opens, Tab/Shift+Tab stay inside it,
  // and focus returns to the button that opened it when it closes. Escape still closes (as before).
  useEffect(() => {
    if (!isOpen) return;
    const modal = modalRef.current;
    const focusables = () =>
      Array.from(
        modal?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]):not([tabindex="-1"]),textarea:not([disabled]),select:not([disabled])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null);
    // Start on the first form field (the close button is first in the DOM but is not the likely target).
    (modal?.querySelector<HTMLElement>("input:not([tabindex='-1'])") ?? focusables()[0])?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      openerRef.current?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (phase === "sending") return;
    const fd = new FormData(e.currentTarget);
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
      propertyId: property?.id,
    });

    if (result.ok) {
      formRef.current?.reset();
      setPhase("sent");
    } else {
      // Keep everything the visitor typed so they can fix it or retry.
      setError(result.error);
      setPhase("form");
    }
  }

  const sending = phase === "sending";
  const sent = phase === "sent";

  return (
    <InquiryContext.Provider value={value}>
      {children}
      <div
        className={`modal-backdrop${isOpen ? " open" : ""}`}
        id="inquiryModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modalTitle"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="modal" ref={modalRef}>
          <button className="close" aria-label="Close dialog" onClick={close}>
            &times;
          </button>
          <div id="formView" style={sent ? { display: "none" } : undefined}>
            <h2 id="modalTitle">Let’s Talk Property</h2>
            <p>Send an inquiry to Marie Chris L. Tagsip.</p>
            {property && <p className="modal-about">About: {property.title}</p>}
            <form id="inquiryForm" ref={formRef} onSubmit={onSubmit}>
              <div className="form-field">
                <label htmlFor="name">Name</label>
                <input id="name" name="name" required minLength={2} maxLength={100} autoComplete="name" placeholder="Your name" />
              </div>
              <div className="form-field">
                <label htmlFor="phone">Phone</label>
                <input id="phone" name="phone" type="tel" inputMode="tel" required maxLength={30} autoComplete="tel" placeholder="+63" />
              </div>
              <div className="form-field">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com" />
              </div>
              <div className="form-field">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  required
                  minLength={5}
                  maxLength={2000}
                  placeholder={
                    property ? "Tell us what you’d like to know about this property..." : "Tell us what property you’re looking for..."
                  }
                />
              </div>
              {/* Honeypot: invisible to people, tempting to bots. The API drops any inquiry that fills it. */}
              <div className="hp" aria-hidden="true">
                <label htmlFor="hp_extra">Leave this empty</label>
                <input id="hp_extra" name="hp_extra" type="text" tabIndex={-1} autoComplete="off" />
              </div>
              <div className="form-check">
                <input id="consent" name="consent" type="checkbox" required />
                <label htmlFor="consent">{CONSENT_TEXT}</label>
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
          </div>
          <div className={`success${sent ? " show" : ""}`} id="successView">
            <div className="check">✓</div>
            <h2>Thank you!</h2>
            <p>Your inquiry has been sent to Marie Chris L. Tagsip.</p>
            <button className="gold-btn close-success" onClick={close}>
              Close
            </button>
          </div>
        </div>
      </div>
    </InquiryContext.Provider>
  );
}

export function InquireButton({ children, property }: { children: ReactNode; property?: InquiryProperty }) {
  const { open, openForListing } = useInquiry();
  return (
    <button className="gold-btn open-modal" onClick={property ? () => openForListing(property) : open}>
      {children}
    </button>
  );
}
