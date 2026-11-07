// Comma-separated list of allowed frontend origins, e.g. http://localhost:3000,https://www.example.com
// Phase 13: each entry is trimmed and loses any trailing slash (browsers send Origin WITHOUT one, so
// "https://site.com/" would never match and every inquiry would be refused with 403).
export const isProduction = process.env.NODE_ENV === "production";

export const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const isLocal = (origin: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

/** Startup checks. Only warns (never exits) so a typo cannot take the API, and Render's health check, down. */
export function checkEnvironment(): string[] {
  const problems: string[] = [];

  if (!process.env.DATABASE_URL) problems.push("DATABASE_URL is not set: every database call will fail.");
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    problems.push("JWT_SECRET is missing or shorter than 32 characters: admin login is disabled until it is set.");
  }

  for (const origin of allowedOrigins) {
    if (origin === "*") problems.push('CORS_ORIGINS contains "*": list the real site address instead.');
    else if (!/^https?:\/\/[^/\s]+$/.test(origin)) {
      problems.push(`CORS_ORIGINS entry "${origin}" is not a plain origin (scheme + host, no path).`);
    }
  }

  // Inquiry email notifications (Resend). Optional: without them inquiries are still saved in /admin.
  if (process.env.RESEND_API_KEY && !process.env.INQUIRY_NOTIFY_TO) {
    problems.push("RESEND_API_KEY is set but INQUIRY_NOTIFY_TO is empty: no inquiry emails will be sent.");
  }
  if (!process.env.RESEND_API_KEY && process.env.INQUIRY_NOTIFY_TO) {
    problems.push("INQUIRY_NOTIFY_TO is set but RESEND_API_KEY is missing: no inquiry emails will be sent.");
  }
  if (isProduction && process.env.RESEND_API_KEY && !process.env.INQUIRY_FROM) {
    problems.push("INQUIRY_FROM is not set: emails use Resend's test sender (onboarding@resend.dev), which only delivers to the Resend account owner.");
  }

  if (isProduction) {
    if (!process.env.CORS_ORIGINS) {
      problems.push("CORS_ORIGINS is not set in production: only http://localhost:3000 is allowed, so the live site will be blocked.");
    }
    for (const origin of allowedOrigins) {
      if (isLocal(origin)) problems.push(`CORS_ORIGINS still lists ${origin} in production: remove it at launch.`);
      else if (origin.startsWith("http://")) problems.push(`CORS_ORIGINS entry ${origin} is not https.`);
    }
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      problems.push("Cloudinary variables are not all set: photo upload in /admin will fail.");
    }
    if (process.env.ADMIN1_PASSWORD || process.env.ADMIN2_PASSWORD || process.env.ADMIN_RESET_PASSWORDS === "true") {
      problems.push("ADMIN*_PASSWORD or ADMIN_RESET_PASSWORDS is still set: blank them after the one-time seed.");
    }
  }
  return problems;
}
