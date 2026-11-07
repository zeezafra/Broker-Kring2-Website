import { broker } from "@/lib/broker";
import { absoluteUrl } from "@/lib/site";

// Phase 13: structured data for the home page, built ONLY from facts already in lib/broker.ts
// (name, phone, email, city). No ratings, opening hours, price ranges or street address are claimed,
// because none were supplied. The Facebook page is listed only once the real URL replaces the placeholder.
export default function BrokerJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: broker.brand,
    url: absoluteUrl("/"),
    image: absoluteUrl(broker.photo.src),
    telephone: broker.phone.display,
    email: broker.email,
    address: { "@type": "PostalAddress", addressLocality: "Cebu City", addressCountry: "PH" },
    employee: { "@type": "Person", name: broker.fullName, jobTitle: broker.title },
    ...(broker.facebook.isPlaceholder ? {} : { sameAs: [broker.facebook.url] }),
  };
  // "<" is escaped so no text inside the data can close the script tag.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
