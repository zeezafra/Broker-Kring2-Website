import bcrypt from "bcryptjs";
import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "./db";
import { allowedOrigins } from "./config";

export const COOKIE_NAME = "mct_admin";
const SESSION_DAYS = 7;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

type AdminPublic = { id: number; email: string; name: string };

// ---- helpers -------------------------------------------------------------------------------

function getSecret(): string | null {
  const secret = process.env.JWT_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

// The cookie travels through the Next.js proxy (same origin as the site), so Lax is enough.
// `secure` is on in production so it is only ever sent over HTTPS.
function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

// Tiny cookie reader so we don't need another dependency for one cookie.
function readCookie(req: Request, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i === -1) continue;
    if (part.slice(0, i).trim() === name) {
      try {
        return decodeURIComponent(part.slice(i + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

function toPublic(a: { id: number; email: string; name: string }): AdminPublic {
  return { id: a.id, email: a.email, name: a.name };
}

// A real bcrypt hash of a throwaway string, so a login for an unknown email takes about as long
// as one for a known email (no "this email exists" timing leak).
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

// ---- login throttle (in memory; fine for one Render instance) --------------------------------

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;
const failures = new Map<string, { count: number; resetAt: number }>();

function isThrottled(key: string): boolean {
  const entry = failures.get(key);
  if (!entry) return false;
  if (entry.resetAt < Date.now()) {
    failures.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

function recordFailure(key: string) {
  const entry = failures.get(key);
  if (!entry || entry.resetAt < Date.now()) failures.set(key, { count: 1, resetAt: Date.now() + WINDOW_MS });
  else entry.count += 1;
}

// ---- middleware ------------------------------------------------------------------------------

// Browsers always send Origin on cross-site POSTs. If it is present and not one of our frontends, refuse.
export function checkOrigin(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: "Origin not allowed" });
  }
  next();
}

// Protects every route it is mounted on. Verifies the JWT, then re-loads the admin so a deleted
// account loses access immediately. The admin is exposed as res.locals.admin.
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const secret = getSecret();
  if (!secret) return res.status(503).json({ error: "Admin login is not configured" });

  const token = readCookie(req, COOKIE_NAME);
  if (!token) return res.status(401).json({ error: "Not logged in" });

  let adminId: number;
  try {
    const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
    const sub = typeof payload === "object" ? Number(payload.sub) : NaN;
    if (!Number.isInteger(sub)) throw new Error("bad subject");
    adminId = sub;
  } catch {
    res.clearCookie(COOKIE_NAME, cookieOptions());
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }

  const admin = await prisma.adminUser.findUnique({ where: { id: adminId } });
  if (!admin) {
    res.clearCookie(COOKIE_NAME, cookieOptions());
    return res.status(401).json({ error: "Not logged in" });
  }
  res.locals.admin = toPublic(admin);
  next();
}

// ---- routes ----------------------------------------------------------------------------------

export const authRouter = Router();

// POST /api/auth/login  { email, password }  ->  sets the httpOnly cookie, returns { admin }
authRouter.post("/login", checkOrigin, async (req, res) => {
  const secret = getSecret();
  if (!secret) {
    console.error("JWT_SECRET is missing or shorter than 32 characters; admin login is disabled");
    return res.status(503).json({ error: "Admin login is not configured" });
  }

  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!email || !password || password.length > 200) {
    return res.status(400).json({ error: "Enter your email and password" });
  }

  const throttleKey = `${req.ip}|${email}`;
  if (isThrottled(throttleKey)) {
    return res.status(429).json({ error: "Too many attempts. Try again in a few minutes." });
  }

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  const ok = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
  if (!admin || !ok) {
    recordFailure(throttleKey);
    return res.status(401).json({ error: "Incorrect email or password" });
  }

  failures.delete(throttleKey);
  const token = jwt.sign({}, secret, { algorithm: "HS256", subject: String(admin.id), expiresIn: `${SESSION_DAYS}d` });
  res.cookie(COOKIE_NAME, token, { ...cookieOptions(), maxAge: SESSION_MS });
  res.json({ admin: toPublic(admin) });
});

// POST /api/auth/logout  ->  clears the cookie (works even if the session already expired)
authRouter.post("/logout", checkOrigin, (_req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions());
  res.json({ ok: true });
});

// GET /api/auth/me  ->  { admin } or 401. The frontend uses this to decide whether to show /admin.
authRouter.get("/me", requireAdmin, (_req, res) => {
  res.json({ admin: res.locals.admin as AdminPublic });
});
