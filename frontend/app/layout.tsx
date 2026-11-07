import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { Allura, Playfair_Display } from "next/font/google";
import localFont from "next/font/local";
import { defaultOgImage, siteUrl } from "@/lib/site";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-playfair",
});
// DM Sans is self-hosted from @fontsource/dm-sans: next/font/google@14.2.x crashes on DM Sans
// ("Cannot read properties of null (reading '1')") because Google now serves its files without a
// .woff2 extension. Same family, same weights, so the look is unchanged.
const dmSans = localFont({
  src: [
    { path: "../node_modules/@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../node_modules/@fontsource/dm-sans/files/dm-sans-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../node_modules/@fontsource/dm-sans/files/dm-sans-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../node_modules/@fontsource/dm-sans/files/dm-sans-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-dm-sans",
  display: "swap",
});
const allura = Allura({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-allura",
});

// Phase 13: metadataBase turns every relative canonical / image URL below into an absolute one.
// Pages that set their own openGraph replace this object, so they list their own images.
const description =
  "Cebu Properties by MCT: homes and properties for sale and for rent in Cebu, with Marie Chris L. Tagsip, Licensed Real Estate Broker & Appraiser.";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Cebu Properties by MCT | Marie Chris L. Tagsip",
  description,
  openGraph: {
    type: "website",
    siteName: "Cebu Properties by MCT",
    locale: "en_PH",
    title: "Cebu Properties by MCT | Marie Chris L. Tagsip",
    description,
    images: [defaultOgImage],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#FBF7F1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable} ${allura.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
