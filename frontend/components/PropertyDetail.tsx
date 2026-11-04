import Link from "next/link";
import { LISTING_TYPE_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/admin-api";
import {
  formatArea,
  formatPrice,
  galleryImage,
  locationLine,
  PUBLIC_STATUS_LABELS,
  thumbImage,
  type ApiProperty,
} from "@/lib/public-api";
import { InquireButton } from "./InquiryModal";
import PropertyGallery from "./PropertyGallery";

const icons = {
  bed: "M3 18v-7h18v7M5 11V7h6v4M13 11V8h6v3M3 18v2m18-2v2",
  bath: "M4 12h16v7H4zM7 12V7a2 2 0 0 1 4 0v5M4 19v2m16-2v2",
  area: "M4 4h16v16H4zM8 16l8-8M9 8h7v7",
};

function Stat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="detail-stat">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d={icon} />
      </svg>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

// Server-rendered detail page body. Everything comes from the API; nothing is invented.
export default function PropertyDetail({ p }: { p: ApiProperty }) {
  const statusLabel = PUBLIC_STATUS_LABELS[p.status];
  const location = locationLine(p);
  const photos = p.images.map((url) => ({ full: galleryImage(url), thumb: thumbImage(url) }));
  const stats = [
    p.bedrooms != null && { icon: icons.bed, value: String(p.bedrooms), label: p.bedrooms === 1 ? "Bedroom" : "Bedrooms" },
    p.bathrooms != null && { icon: icons.bath, value: String(p.bathrooms), label: p.bathrooms === 1 ? "Bathroom" : "Bathrooms" },
    p.floorAreaSqm != null && { icon: icons.area, value: `${formatArea(p.floorAreaSqm)} m²`, label: "Floor area" },
    p.lotAreaSqm != null && { icon: icons.area, value: `${formatArea(p.lotAreaSqm)} m²`, label: "Lot area" },
  ].filter((s): s is { icon: string; value: string; label: string } => Boolean(s));

  return (
    <section className="detail">
      <div className="wrap">
        <div className="crumbs" role="navigation" aria-label="Breadcrumb">
          <Link href="/properties">Properties</Link>
          <span aria-hidden="true">›</span>
          <span>{p.title}</span>
        </div>

        <div className="detail-grid">
          <PropertyGallery photos={photos} title={p.title} />

          <div className="detail-panel">
            <div className="chips">
              <span className="chip chip-gold">{LISTING_TYPE_LABELS[p.listingType]}</span>
              <span className="chip">{PROPERTY_TYPE_LABELS[p.propertyType]}</span>
              {statusLabel && <span className="chip chip-dark">{statusLabel}</span>}
            </div>
            <h1 className="detail-title">{p.title}</h1>
            {location && <p className="detail-loc">{location}</p>}
            <p className="detail-price">{formatPrice(p)}</p>

            {stats.length > 0 && (
              <div className="detail-stats">
                {stats.map((s) => (
                  <Stat key={s.label} {...s} />
                ))}
              </div>
            )}

            <InquireButton>Inquire Now &nbsp; →</InquireButton>
            {p.isPlaceholder && <p className="detail-note">This is a sample listing used to preview the site. It is not a real property for sale.</p>}
          </div>
        </div>

        {p.description && (
          <div className="detail-desc">
            <h2>About this property</h2>
            <p>{p.description}</p>
          </div>
        )}
      </div>
    </section>
  );
}
