import type { ReactNode } from "react";
import { broker } from "@/lib/broker";

// /about only. The homepage broker section, /contact and /sell keep using BrokerParts.tsx, which is untouched.
// Every value comes from lib/broker.ts (the single source), so nothing here can drift from the footer or /contact.

const icon = { viewBox: "0 0 24 24", "aria-hidden": true, focusable: false } as const;

/** "TAGSIP, REB, REA" -> large surname + quieter credential suffix. The full string stays the h1's text. */
export function AboutName() {
  const i = broker.surnameLine.indexOf(",");
  const surname = i === -1 ? broker.surnameLine : broker.surnameLine.slice(0, i);
  const suffix = i === -1 ? "" : broker.surnameLine.slice(i);
  return (
    <>
      <div className="ab-script">{broker.firstLine}</div>
      <h1 className="ab-name">
        {surname}
        {suffix && <span className="ab-suffix">{suffix}</span>}
      </h1>
    </>
  );
}

export function AboutPositioning() {
  const text = broker.positioning ?? broker.taglineLines.join(" ");
  return <p className="ab-position">{text}</p>;
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="ab-section" aria-labelledby={id}>
      <div className="ab-head">
        <h2 id={id}>{title}</h2>
        <span className="ab-rule" aria-hidden="true" />
      </div>
      {children}
    </section>
  );
}

/** Biography. `broker.bio` is one string per paragraph; null shows a quiet, clearly pending note (no dashed box). */
export function AboutBio() {
  return (
    <Section id="about-bio" title="About">
      {broker.bio && broker.bio.length > 0 ? (
        <div className="ab-bio">
          {broker.bio.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      ) : (
        <p className="ab-bio-pending">Marie Chris&rsquo;s personal introduction will appear here.</p>
      )}
    </Section>
  );
}

export function AboutCredentials() {
  return (
    <Section id="about-creds" title="Professional credentials">
      <ul className="ab-creds">
        <li className="ab-cred">
          <span className="ab-ico" aria-hidden="true">
            <svg {...icon}>
              <circle cx="12" cy="9" r="5" />
              <path d="m8.8 13.2-1.3 7.3L12 18.2l4.5 2.3-1.3-7.3" />
            </svg>
          </span>
          <div>
            <p className="ab-label">PRC Lic. No.</p>
            <p className="ab-value">{broker.prcLicenseNo}</p>
            <p className="ab-issuer">Professional Regulation Commission</p>
          </div>
        </li>
        <li className="ab-cred">
          <span className="ab-ico" aria-hidden="true">
            <svg {...icon}>
              <path d="M12 3 4.5 6v5.5c0 4.4 3.1 8.2 7.5 9.5 4.4-1.3 7.5-5.1 7.5-9.5V6L12 3Z" />
              <path d="m9 12 2.2 2.2L15.2 10" />
            </svg>
          </span>
          <div>
            <p className="ab-label">DHSUD Reg. No.</p>
            <p className="ab-value">{broker.dhsudRegNo}</p>
            <p className="ab-issuer">Department of Human Settlements and Urban Development</p>
          </div>
        </li>
      </ul>
    </Section>
  );
}

export function AboutContact() {
  return (
    <Section id="about-contact" title="Get in touch">
      <ul className="ab-contact">
        <li>
          <a href={broker.phone.href}>
            <span className="ab-ico" aria-hidden="true">
              <svg {...icon}>
                <path d="M5 3h4l2 5-3 2a16 16 0 0 0 6 6l2-3 5 2v4c0 1-1 2-2 2C10 20 4 14 3 5c0-1 1-2 2-2Z" />
              </svg>
            </span>
            <span className="ab-ctext">
              <small>Call</small>
              <span>{broker.phone.display}</span>
            </span>
            <Arrow />
          </a>
        </li>
        <li>
          <a href={`mailto:${broker.email}`}>
            <span className="ab-ico" aria-hidden="true">
              <svg {...icon}>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m4 7 8 6 8-6" />
              </svg>
            </span>
            <span className="ab-ctext">
              <small>Email</small>
              <span>{broker.email}</span>
            </span>
            <Arrow />
          </a>
        </li>
        <li>
          <a href={broker.facebook.url} target="_blank" rel="noopener noreferrer">
            <span className="ab-ico" aria-hidden="true">
              <svg {...icon}>
                <path d="M14 8.5h2.5V5H14a4 4 0 0 0-4 4v2H8v3.5h2V21h3.5v-6.5h2.3l.7-3.5h-3V9.3c0-.5.3-.8.5-.8Z" />
              </svg>
            </span>
            <span className="ab-ctext">
              <small>Facebook</small>
              <span>
                {broker.facebook.label}
                <span className="sr-only"> (opens in a new tab)</span>
              </span>
            </span>
            <Arrow />
          </a>
        </li>
        <li>
          <div className="ab-static">
            <span className="ab-ico" aria-hidden="true">
              <svg {...icon}>
                <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
            </span>
            <span className="ab-ctext">
              <small>Based in</small>
              <span>{broker.location}</span>
            </span>
          </div>
        </li>
      </ul>
    </Section>
  );
}

function Arrow() {
  return (
    <svg className="ab-arrow" {...icon}>
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}
