import "dotenv/config";
import cors from "cors";
import express from "express";
import { adminRouter } from "./admin";
import { authRouter } from "./auth";
import { allowedOrigins } from "./config";
import { prisma } from "./db";
import { propertiesRouter } from "./properties";

const app = express();
const port = Number(process.env.PORT) || 4000;

// Render sits behind a proxy; trust one hop so req.ip is the real client (used by the login throttle).
app.set("trust proxy", 1);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

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
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);

// Express 5 forwards async errors here; keep the response JSON and don't leak internals.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err instanceof Error ? err.message : err);
  res.status(500).json({ error: "Something went wrong" });
});

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.warn("JWT_SECRET is missing or shorter than 32 characters: admin login is disabled until it is set.");
}

app.listen(port, () => console.log(`API listening on port ${port}`));
