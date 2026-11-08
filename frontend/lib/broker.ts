// Phase 9: the ONE place for the broker's name, credentials, contact details and taglines.
// The homepage broker section, the footer credentials bar and /about all read from here.
// Phase 12 (contact page, header, footer) will read the same constant, so never copy these values elsewhere.
//
// Credentials, phone and email were read from the broker's info card: she must confirm them before launch (Phase 13).
// Marie Chris's numbers differ from Merlinda G. Alonzo's by one digit (0036820 / 8696 vs 0036821 / 8695): do not mix them.

export type Broker = {
  /** Script line above the surname on the homepage ("Marie Chris L."). */
  firstLine: string;
  /** Large serif line ("TAGSIP, REB, REA"). */
  surnameLine: string;
  fullName: string;
  title: string;
  brand: string;
  phone: { display: string; href: string };
  email: string;
  location: string;
  /** PLACEHOLDER url (facebook.com) until the broker gives the real page address. */
  facebook: { label: string; url: string; isPlaceholder: boolean };
  prcLicenseNo: string;
  dhsudRegNo: string;
  taglineLines: string[];
  /**
   * Short positioning statement shown under the title on /about. Optional: when omitted, /about uses the two
   * tagline lines from the broker's card joined together. Only put text here that Marie Chris has approved.
   */
  positioning?: string;
  trust: { lead: string; small: string };
  photo: { src: string; alt: string };
  /**
   * The broker's own introduction, one string per paragraph. Must be written or approved by Marie Chris.
   * While this is null, /about shows a clearly marked placeholder. Do not invent years of experience,
   * achievements or specialties.
   */
  bio: string[] | null;
};

export const broker: Broker = {
  firstLine: "Marie Chris L.",
  surnameLine: "TAGSIP, REB, REA",
  fullName: "Marie Chris L. Tagsip, REB, REA",
  title: "Licensed Real Estate Broker & Appraiser",
  brand: "Cebu Properties by MCT",
  phone: { display: "+63 936 948 0702", href: "tel:+639369480702" },
  email: "cebupropertiesbymct@gmail.com",
  location: "Cebu City, Philippines",
  facebook: { label: "Cebu Properties by MCT", url: "https://www.facebook.com/profile.php?id=100089713393975", isPlaceholder: false },
  prcLicenseNo: "0036820",
  dhsudRegNo: "R7-B-06/26-8696",
  taglineLines: ["Helping you find the right property.", "Turning your real estate goals into reality."],
  trust: { lead: "Your Trusted Partner", small: "IN REAL ESTATE" },
  photo: { src: "/images/marie-chris-tagsip.jpg", alt: "Marie Chris L. Tagsip, REB, REA" },
  bio: [
  "Welcome! I am Marie Chris L. Tagsip, a Licensed Real Estate Broker and Real Estate Appraiser based in Cebu City, Philippines.",
  "With a passion for real estate and a commitment to serving people, I am dedicated to helping you find the right property, whether you are looking to buy your dream home, explore rental opportunities, or sell your property.",
  "I believe that real estate is more than just a transaction. It is about building relationships, discovering opportunities, and making informed decisions that shape your future.",
  "Guided by my faith and trust in God's plan, I approach every opportunity with integrity, dedication, and genuine care for the people I serve.",
  "Your next chapter begins with the right property. I look forward to helping you make it happen."
  ],
};
