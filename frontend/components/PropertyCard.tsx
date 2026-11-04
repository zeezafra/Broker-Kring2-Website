import Link from "next/link";
import { cardImage, formatArea, formatPrice, locationLine, PUBLIC_STATUS_LABELS, type ApiProperty } from "@/lib/public-api";

// One listing card, shared by the home page and /properties so they never drift apart.
// The whole card links to the real detail route (/properties/[id]).
export function PropertyCard({ p }: { p: ApiProperty }) {
  const statusLabel = PUBLIC_STATUS_LABELS[p.status];
  const location = locationLine(p);

  return (
    <article className="property-card">
      <Link className="card-link" href={`/properties/${p.id}`}>
        <div className="property-photo">
          {p.images[0] && (
            // eslint-disable-next-line @next/next/no-img-element -- Cloudinary/Unsplash hosts; plain img keeps the original markup
            <img src={cardImage(p.images[0])} alt="" loading="lazy" />
          )}
          <span className="price">{formatPrice(p)}</span>
          {statusLabel && <span className="status-badge">{statusLabel}</span>}
          {p.isPlaceholder && <span className="sample-badge">Sample listing</span>}
        </div>
        <div className="card-body">
          <h3 className="card-title">{p.title}</h3>
          {location && <p className="card-loc">{location}</p>}
        </div>
        {(p.bedrooms != null || p.bathrooms != null || p.floorAreaSqm != null) && (
          <div className="features">
            {p.bedrooms != null && (
              <span>
                <svg viewBox="0 0 24 24">
                  <path d="M3 18v-7h18v7M5 11V7h6v4M13 11V8h6v3M3 18v2m18-2v2" />
                </svg>
                {p.bedrooms} {p.bedrooms === 1 ? "Bed" : "Beds"}
              </span>
            )}
            {p.bathrooms != null && (
              <span>
                <svg viewBox="0 0 24 24">
                  <path d="M4 12h16v7H4zM7 12V7a2 2 0 0 1 4 0v5M4 19v2m16-2v2" />
                </svg>
                {p.bathrooms} {p.bathrooms === 1 ? "Bath" : "Baths"}
              </span>
            )}
            {p.floorAreaSqm != null && (
              <span>
                <svg viewBox="0 0 24 24">
                  <path d="M4 4h16v16H4zM8 16l8-8M9 8h7v7" />
                </svg>
                {formatArea(p.floorAreaSqm)} m²
              </span>
            )}
          </div>
        )}
      </Link>
    </article>
  );
}

export function PropertyCardSkeletons({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <article className="property-card skeleton" key={i} aria-hidden="true">
          <div className="property-photo" />
          <div className="features">
            <span className="skeleton-bar" />
          </div>
        </article>
      ))}
    </>
  );
}
