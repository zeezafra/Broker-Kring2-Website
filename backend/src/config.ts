// Comma-separated list of allowed frontend origins, e.g. http://localhost:3000,https://your-app.vercel.app
export const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
