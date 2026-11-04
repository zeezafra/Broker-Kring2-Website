// Broker contact details are real data from the broker's card (to be confirmed by her before launch).
// Facebook link is a PLACEHOLDER awaiting the broker. Portrait: waist-up photo supplied by Zee (public/images/marie-chris-tagsip.jpg).
import Image from "next/image";

export default function Broker() {
  return (
    <section className="broker" id="broker">
      <div className="wrap broker-grid">
        <div className="portrait-wrap">
          <div className="portrait has-photo">
            <Image
              src="/images/marie-chris-tagsip.jpg"
              alt="Marie Chris L. Tagsip, REB, REA"
              fill
              sizes="(max-width: 650px) 235px, 310px"
              priority={false}
            />
          </div>
        </div>
        <div className="broker-copy">
          <div className="broker-name">Marie Chris L.</div>
          <h2>TAGSIP, REB, REA</h2>
          <div className="broker-title">Licensed Real Estate Broker &amp; Appraiser</div>
          <div className="house-divider">
            <svg viewBox="0 0 24 24">
              <path d="M2 11 12 2l10 9h-3v10h-6v-6H9v6H5V11z" />
            </svg>
          </div>
          <div className="contact-list">
            <a className="contact-row" href="tel:+639369480702">
              <span className="contact-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M5 3h4l2 5-3 2a16 16 0 0 0 6 6l2-3 5 2v4c0 1-1 2-2 2C10 20 4 14 3 5c0-1 1-2 2-2Z" />
                </svg>
              </span>
              +63 936 948 0702
            </a>
            <a className="contact-row" href="mailto:mariechristagsip@gmail.com">
              <span className="contact-icon">
                <svg viewBox="0 0 24 24">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m4 7 8 6 8-6" />
                </svg>
              </span>
              mariechristagsip@gmail.com
            </a>
            <div className="contact-row">
              <span className="contact-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
              </span>
              Cebu City, Philippines
            </div>
            <a className="contact-row" href="https://www.facebook.com/" target="_blank" rel="noopener">
              <span className="contact-icon" style={{ fontWeight: 700, fontSize: 21 }}>
                f
              </span>
              Cebu Properties by MCT
            </a>
          </div>
          <div className="tagline">
            Helping you find the right property.
            <br />
            Turning your real estate goals into reality.
          </div>
        </div>
      </div>
    </section>
  );
}
