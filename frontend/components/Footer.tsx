import { broker } from "@/lib/broker";

// Phase 9: credentials and the trust line come from lib/broker.ts.
export default function Footer() {
  return (
    <footer id="contact">
      <div className="wrap footer-grid">
        <div className="footer-item">
          <div className="footer-icon">▤</div>
          <div className="footer-label">
            PRC Lic. No.<strong>{broker.prcLicenseNo}</strong>
          </div>
        </div>
        <div className="footer-item">
          <div className="footer-icon">⌂</div>
          <div className="footer-label">
            DHSUD Reg. No.<strong>{broker.dhsudRegNo}</strong>
          </div>
        </div>
        <div className="footer-trust">
          {broker.trust.lead}
          <small>{broker.trust.small}</small>
        </div>
      </div>
    </footer>
  );
}
