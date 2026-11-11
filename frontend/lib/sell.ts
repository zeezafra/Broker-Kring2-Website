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
  title: "Ready to Sell or Appraise Your Property?",
  intro:
    "As a licensed real estate broker and appraiser, I can help you sell your property or assess its value. Tell me about your property and what you need, and I will get back to you.",
  options: {
    SELL: { label: "Sell my property", hint: "I’d like to talk about selling it." },
    APPRAISAL: { label: "Request an appraisal", hint: "I’d like my property appraised." },
  },
  locationLabel: "Where is the property?",
  locationPlaceholder: "Town, barangay or address",
  messagePlaceholder: "Tell me about the property: type, lot or floor area, and anything else you’d like me to know...",
} as const;
