"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

type InquiryContextValue = { open: () => void };

const InquiryContext = createContext<InquiryContextValue | null>(null);

export function useInquiry() {
  const ctx = useContext(InquiryContext);
  if (!ctx) throw new Error("useInquiry must be used inside <InquiryProvider>");
  return ctx;
}

// Ported from the HTML's modal: open/close, Escape, backdrop click, body scroll lock.
// The submit is still the demo behavior (nothing is saved); Phase 10 wires it to the Inquiry table.
export function InquiryProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const value = useMemo(() => ({ open }), [open]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

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
        <div className="modal">
          <button className="close" aria-label="Close dialog" onClick={close}>
            &times;
          </button>
          <div id="formView" style={submitted ? { display: "none" } : undefined}>
            <h2 id="modalTitle">Let’s Talk Property</h2>
            <p>Send an inquiry to Marie Chris L. Tagsip.</p>
            <form id="inquiryForm" onSubmit={onSubmit}>
              <div className="form-field">
                <label htmlFor="name">Name</label>
                <input id="name" name="name" required placeholder="Your name" />
              </div>
              <div className="form-field">
                <label htmlFor="phone">Phone</label>
                <input id="phone" name="phone" required placeholder="+63" />
              </div>
              <div className="form-field">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" required placeholder="you@example.com" />
              </div>
              <div className="form-field">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  required
                  placeholder="Tell us what property you’re looking for..."
                />
              </div>
              <button className="gold-btn" type="submit">
                Send Inquiry
              </button>
            </form>
          </div>
          <div className={`success${submitted ? " show" : ""}`} id="successView">
            <div className="check">✓</div>
            <h2>Thank you!</h2>
            <p>Your inquiry has been recorded in this demo.</p>
            <button className="gold-btn close-success" onClick={close}>
              Close
            </button>
          </div>
        </div>
      </div>
    </InquiryContext.Provider>
  );
}

export function InquireButton({ children }: { children: ReactNode }) {
  const { open } = useInquiry();
  return (
    <button className="gold-btn open-modal" onClick={open}>
      {children}
    </button>
  );
}
