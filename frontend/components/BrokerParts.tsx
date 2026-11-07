import Image from "next/image";
import { broker } from "@/lib/broker";

// Pieces shared by the homepage broker section and /about, so both always show the same data and markup.

// `priority` is for /about, where the portrait is the first thing on screen (it is below the fold on the home page).
export function BrokerPortrait({ priority = false }: { priority?: boolean }) {
  return (
    <div className="portrait-wrap">
      <div className="portrait has-photo">
        <Image src={broker.photo.src} alt={broker.photo.alt} fill sizes="(max-width: 650px) 235px, 310px" priority={priority} />
      </div>
    </div>
  );
}

export function BrokerContactList() {
  return (
    <div className="contact-list">
      <a className="contact-row" href={broker.phone.href}>
        <span className="contact-icon">
          <svg viewBox="0 0 24 24">
            <path d="M5 3h4l2 5-3 2a16 16 0 0 0 6 6l2-3 5 2v4c0 1-1 2-2 2C10 20 4 14 3 5c0-1 1-2 2-2Z" />
          </svg>
        </span>
        {broker.phone.display}
      </a>
      <a className="contact-row" href={`mailto:${broker.email}`}>
        <span className="contact-icon">
          <svg viewBox="0 0 24 24">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m4 7 8 6 8-6" />
          </svg>
        </span>
        {broker.email}
      </a>
      <div className="contact-row">
        <span className="contact-icon">
          <svg viewBox="0 0 24 24">
            <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
        </span>
        {broker.location}
      </div>
      <a className="contact-row" href={broker.facebook.url} target="_blank" rel="noopener">
        <span className="contact-icon" style={{ fontWeight: 700, fontSize: 21 }}>
          f
        </span>
        {broker.facebook.label}
      </a>
    </div>
  );
}

export function BrokerTagline() {
  return (
    <div className="tagline">
      {broker.taglineLines[0]}
      <br />
      {broker.taglineLines[1]}
    </div>
  );
}

export function HouseDivider() {
  return (
    <div className="house-divider">
      <svg viewBox="0 0 24 24">
        <path d="M2 11 12 2l10 9h-3v10h-6v-6H9v6H5V11z" />
      </svg>
    </div>
  );
}
