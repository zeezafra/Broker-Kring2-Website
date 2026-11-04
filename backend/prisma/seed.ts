import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/db";

// PLACEHOLDER listings, matching the three cards in the original HTML (stock Unsplash photos,
// invented prices). They are NOT real inventory: every row is flagged isPlaceholder so the site
// can label them, and so this script can remove them without touching real listings.
// City and address are left empty on purpose: the HTML never stated one, so none is invented.
const placeholders = [
  {
    title: "Modern luxury house",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=85",
    price: 12_000_000,
    bedrooms: 3,
    bathrooms: 2,
    floorAreaSqm: 120,
  },
  {
    title: "Contemporary two-storey home",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=85",
    price: 8_500_000,
    bedrooms: 2,
    bathrooms: 2,
    floorAreaSqm: 85,
  },
  {
    title: "Single-storey modern residence",
    image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1000&q=85",
    price: 15_000_000,
    bedrooms: 4,
    bathrooms: 3,
    floorAreaSqm: 150,
  },
];

// Admin accounts (Zee + Marie Chris). Credentials come from env vars, never from code:
//   ADMIN1_NAME / ADMIN1_EMAIL / ADMIN1_PASSWORD   and   ADMIN2_NAME / ADMIN2_EMAIL / ADMIN2_PASSWORD
// Existing accounts are left alone unless ADMIN_RESET_PASSWORDS=true (use that to set a new password).
async function seedAdmins() {
  const reset = process.env.ADMIN_RESET_PASSWORDS === "true";
  for (const n of [1, 2]) {
    const name = process.env[`ADMIN${n}_NAME`]?.trim();
    const email = process.env[`ADMIN${n}_EMAIL`]?.trim().toLowerCase();
    const password = process.env[`ADMIN${n}_PASSWORD`];
    if (!name && !email && !password) {
      console.log(`Admin ${n}: ADMIN${n}_* not set, skipped.`);
      continue;
    }
    if (!name || !email || !password) {
      console.warn(`Admin ${n}: needs ADMIN${n}_NAME, ADMIN${n}_EMAIL and ADMIN${n}_PASSWORD, skipped.`);
      continue;
    }
    if (password.length < 12) {
      console.warn(`Admin ${n}: password must be at least 12 characters, skipped.`);
      continue;
    }
    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing && !reset) {
      console.log(`Admin ${n}: ${email} already exists, left unchanged.`);
      continue;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    if (existing) {
      await prisma.adminUser.update({ where: { email }, data: { name, passwordHash } });
      console.log(`Admin ${n}: ${email} password reset.`);
    } else {
      await prisma.adminUser.create({ data: { name, email, passwordHash } });
      console.log(`Admin ${n}: ${email} created.`);
    }
  }
}

async function main() {
  // Safe to re-run: only placeholder rows are ever deleted.
  const removed = await prisma.property.deleteMany({ where: { isPlaceholder: true } });

  // Created in reverse so the API's newest-first order matches the card order in the HTML.
  for (const p of [...placeholders].reverse()) {
    await prisma.property.create({
      data: {
        title: p.title,
        listingType: "SALE",
        propertyType: "HOUSE_AND_LOT",
        status: "AVAILABLE",
        price: p.price,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        floorAreaSqm: p.floorAreaSqm,
        images: [p.image],
        featured: true,
        isPlaceholder: true,
      },
    });
  }

  await seedAdmins();

  console.log(`Seed done: removed ${removed.count} old placeholder(s), created ${placeholders.length}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
