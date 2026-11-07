import type { Metadata } from "next";
import { AboutBio, AboutContact, AboutCredentials, AboutName, AboutPositioning } from "@/components/AboutParts";
import { BrokerPortrait, HouseDivider } from "@/components/BrokerParts";
import SiteShell from "@/components/SiteShell";
import { broker } from "@/lib/broker";

export const metadata: Metadata = {
  alternates: { canonical: "/about" },
  title: `About ${broker.fullName} | ${broker.brand}`,
  description: `${broker.fullName} is a ${broker.title} in ${broker.location}. PRC Lic. No. ${broker.prcLicenseNo} · DHSUD Reg. No. ${broker.dhsudRegNo}.`,
};

// Phase 9 data, redesigned layout: everything still comes from lib/broker.ts (same source as the homepage and footer).
// Styles live in the "About page" block at the end of globals.css, all scoped under .about-page.
export default function AboutPage() {
  return (
    <SiteShell>
      <section className="about-page">
        <div className="wrap ab-grid">
          <aside className="ab-aside">
            <BrokerPortrait priority />
            <p className="ab-brand">{broker.brand}</p>
          </aside>
          <div className="ab-main">
            <div className="ab-intro">
              <AboutName />
              <div className="ab-title">{broker.title}</div>
              <AboutPositioning />
            </div>
            <HouseDivider />
            <AboutBio />
            <AboutCredentials />
            <AboutContact />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
