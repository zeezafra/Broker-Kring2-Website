import { broker } from "./broker";

// Phase 11: the words on /sell, in ONE place.
//
// DRAFT WORDING. Marie Chris has not approved this page yet (Phase 0: "placeholder wording until the broker
// approves"). It only restates facts already on the site (she is a licensed broker AND appraiser, her numbers)
// and invites the visitor to write to her. It makes no promises about fees, timelines, valuation methods,
// results or years of experience, and must not gain any until she supplies them.
//
// `approved` is the single switch. While false: the page shows a "draft" note, is hidden from search engines,
// and the Sell link in the header keeps pointing at the home-page footer (as in the original HTML).
// When she approves the wording (or sends her own), edit the text below and set `approved: true`.
export const sellPage = {
  approved: false,
  title: "Selling or Appraising Your Property?",
  intro: `Send ${broker.fullName} the details of your property and what you need, and she will reply to your inquiry.`,
  options: {
    SELL: { label: "Sell my property", hint: "I’d like to talk about selling it." },
    APPRAISAL: { label: "Request an appraisal", hint: "I’d like my property appraised." },
  },
  locationLabel: "Where is the property?",
  locationPlaceholder: "Town, barangay or address",
  messagePlaceholder: "Tell us about the property: type, size, and anything else you’d like us to know...",
} as const;
