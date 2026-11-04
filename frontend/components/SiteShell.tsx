import type { ReactNode } from "react";
import Footer from "./Footer";
import Header from "./Header";
import { InquiryProvider } from "./InquiryModal";

// Header + inquiry modal + footer for the inner pages (/properties, /properties/[id]).
// The home page composes the same pieces itself in app/page.tsx.
export default function SiteShell({ children }: { children: ReactNode }) {
  return (
    <InquiryProvider>
      <Header />
      <main>{children}</main>
      <Footer />
    </InquiryProvider>
  );
}
