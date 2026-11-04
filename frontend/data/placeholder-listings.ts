// PLACEHOLDER listings carried over from the original HTML (stock Unsplash photos, invented prices).
// Not real inventory. Phase 3 moves listings into the database with an is-placeholder flag,
// and Phase 6 replaces these cards with live API data.
export type PlaceholderListing = {
  id: string;
  image: string;
  alt: string;
  price: string;
  beds: number;
  baths: number;
  area: number;
};

export const placeholderListings: PlaceholderListing[] = [
  {
    id: "placeholder-1",
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=85",
    alt: "Modern luxury house exterior",
    price: "₱12,000,000",
    beds: 3,
    baths: 2,
    area: 120,
  },
  {
    id: "placeholder-2",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=85",
    alt: "Contemporary two-storey home",
    price: "₱8,500,000",
    beds: 2,
    baths: 2,
    area: 85,
  },
  {
    id: "placeholder-3",
    image:
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1000&q=85",
    alt: "Single-storey modern residence",
    price: "₱15,000,000",
    beds: 4,
    baths: 3,
    area: 150,
  },
];
