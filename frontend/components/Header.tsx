"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { InquireButton } from "./InquiryModal";

// Nav labels are copied exactly from the HTML. Hrefs are absolute so the same header works on the
// home page and on inner pages. Sell/Contact still point at the home page footer until Phases 11-12.
const links = [
  { key: "home", label: "Home", href: "/" },
  { key: "buy", label: "Buy", href: "/properties?listing=buy" },
  { key: "rent", label: "Rent", href: "/properties?listing=rent" },
  { key: "sell", label: "Sell", href: "/#contact" },
  { key: "about", label: "About", href: "/#broker" },
  { key: "contact", label: "Contact", href: "/#contact" },
];

function NavItems({ activeKey, onNavigate }: { activeKey: string | null; onNavigate: () => void }) {
  return (
    <>
      {links.map((l) => (
        <Link key={l.key} className={l.key === activeKey ? "active" : undefined} href={l.href} onClick={onNavigate}>
          {l.label}
        </Link>
      ))}
    </>
  );
}

// Reads the URL so Buy/Rent light up on /properties?listing=... (needs a Suspense boundary).
function ActiveNavItems({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const listing = useSearchParams().get("listing");
  let activeKey: string | null = null;
  if (pathname === "/") activeKey = "home";
  else if (pathname === "/properties" && (listing === "buy" || listing === "rent")) activeKey = listing;
  return <NavItems activeKey={activeKey} onNavigate={onNavigate} />;
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header>
      <div className="wrap nav">
        <Link className="brand" href="/" aria-label="Cebu Properties by MCT home">
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <path d="M5 21 24 5l19 16v22H29V29H19v14H5z" />
            <path d="M24 5v10" />
          </svg>
          <span>
            Cebu Properties<span className="brand-by"> by MCT</span>
          </span>
        </Link>
        <button
          className="menu-toggle"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? "×" : "☰"}
        </button>
        <nav id="mainNav" className={menuOpen ? "open" : undefined}>
          <Suspense fallback={<NavItems activeKey={null} onNavigate={closeMenu} />}>
            <ActiveNavItems onNavigate={closeMenu} />
          </Suspense>
        </nav>
        <InquireButton>Inquire Now</InquireButton>
      </div>
    </header>
  );
}
