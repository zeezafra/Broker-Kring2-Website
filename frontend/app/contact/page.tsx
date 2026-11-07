import type { Metadata } from "next";
import { BrokerContactList } from "@/components/BrokerParts";
import ContactForm from "@/components/ContactForm";
import SiteShell from "@/components/SiteShell";
import { broker } from "@/lib/broker";
import { contactPage } from "@/lib/contact";

export const metadata: Metadata = {
  alternates: { canonical: "/contact" },
  title: `Contact | ${broker.brand}`,
  description: `Contact ${broker.fullName}, ${broker.title} in ${broker.location}, by phone, email or inquiry form.`,
};

// Phase 12. Layout and form styling reuse the /sell classes (Phase 11) so the two pages always match.
// Phone, email, location and Facebook come from lib/broker.ts, the same source as the homepage and /about.
export default function ContactPage() {
  return (
    <SiteShell>
      <section className="sell">
        <div className="wrap sell-grid">
          <div className="sell-copy">
            <div className="broker-title">{broker.title}</div>
            <h1>{contactPage.title}</h1>
            <p className="sell-intro">{contactPage.intro}</p>
            <BrokerContactList />
            {broker.facebook.isPlaceholder && (
              <p className="bio-placeholder">
                <strong>Placeholder.</strong> The Facebook link goes to facebook.com until Marie Chris gives the address of her page.
              </p>
            )}
          </div>
          <div className="sell-card">
            <ContactForm />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
