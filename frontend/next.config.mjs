// Server-side only (not exposed to the browser). Falls back to the public URL, then to local dev.
const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Admin calls go to /api/* on THIS site and Next forwards them to the Render API. That keeps the
  // login cookie first-party (no cross-site cookie problems in Safari/Chrome) and avoids CORS for /admin.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
