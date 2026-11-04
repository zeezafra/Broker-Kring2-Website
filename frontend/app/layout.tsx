import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { Allura, DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-playfair",
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
});
const allura = Allura({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-allura",
});

export const metadata: Metadata = {
  title: "Cebu Properties by MCT | Marie Chris L. Tagsip",
};

export const viewport: Viewport = {
  themeColor: "#FBF7F1",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable} ${allura.variable}`}>
      <body>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
