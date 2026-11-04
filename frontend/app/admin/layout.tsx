import type { Metadata } from "next";

// The admin area must never show up in search results.
export const metadata: Metadata = {
  title: "Admin | Cebu Properties by MCT",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="min-h-screen bg-cream text-ink">{children}</div>;
}
