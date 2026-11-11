import "dotenv/config";
import cors from "cors";
import express from "express";
import { adminRouter } from "./admin";
import { authRouter } from "./auth";
import { allowedOrigins, checkEnvironment, isProduction } from "./config";
import { prisma } from "./db";
import { inquiriesRouter } from "./inquiries";
import { publicLocationsRouter } from "./locations";
import { propertiesRouter } from "./properties";

const app = express();
const port = Number(process.env.PORT) || 4000;

// Render sits behind a proxy; trust one hop so req.ip is the real client (used by the login throttle).
app.set("trust proxy", 1);

app.disable("x-powered-by");

// Phase 13: baseline security headers (no new dependency). This API only returns JSON, so the strictest
// possible policies are safe. HSTS only in production (Render terminates TLS in front of us).
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  if (isProduction) res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  next();
});

app.use(cors({ origin: allowedOrigins, credentials: true }));
// Inquiries and listings are small; a tight limit stops oversized bodies early.
app.use(express.json({ limit: "100kb" }));

// Logged-in and admin responses must never be cached by a browser or a shared cache.
app.use(["/api/auth", "/api/admin"], (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.get("/api/health", async (_req, res) => {
  let database: "up" | "down" = "down";
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "up";
  } catch (err) {
    console.error("Health check: database unreachable", err instanceof Error ? err.message : err);
  }
  // 200 even if the DB is down, so Render's health check keeps the service alive;
  // the frontend shows the database state separately.
  res.json({ status: "ok", database, time: new Date().toISOString() });
});

app.use("/api/properties", propertiesRouter);
app.use("/api/locations", publicLocationsRouter);
app.use("/api/inquiries", inquiriesRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);

// Unknown API paths get a JSON 404 instead of Express's default HTML page.
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Express 5 forwards async errors here; keep the response JSON and don't leak internals.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // Body-parser errors (bad JSON, body over the 100kb limit) carry a 4xx status: pass that on, not a 500.
  const status = typeof (err as { status?: unknown })?.status === "number" ? (err as { status: number }).status : 500;
  if (status >= 400 && status < 500) {
    return res.status(status).json({ error: status === 413 ? "Request is too large" : "Invalid request" });
  }
  console.error(err instanceof Error ? err.message : err);
  res.status(500).json({ error: "Something went wrong" });
});

for (const problem of checkEnvironment()) console.warn(`[config] ${problem}`);
console.log(`[config] CORS allows: ${allowedOrigins.join(", ") || "(nothing)"}`);

app.listen(port, () => console.log(`API listening on port ${port}`));
