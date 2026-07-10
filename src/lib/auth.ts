// -----------------------------------------------------------------------------
// Lightweight, dependency-free authentication for the single-admin CMS.
//   - Passwords hashed with scrypt (Node crypto).
//   - Sessions are stateless, signed cookies (HMAC-SHA256 over {user, exp}).
// This runs only on the Node.js runtime (server components / actions / routes).
// -----------------------------------------------------------------------------

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { cookies } from "next/headers";
import type { AdminUser } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const AUTH_FILE = path.join(DATA_DIR, "auth.json");

export const SESSION_COOKIE = "dm_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days (seconds)

function authSecret(): string {
  // A stable secret is required so sessions survive restarts. Set AUTH_SECRET
  // in .env.local. The fallback keeps local dev working but is NOT secure.
  return (
    process.env.AUTH_SECRET ||
    "insecure-dev-secret-change-me-in-env-local-please"
  );
}

// ---- Password hashing ------------------------------------------------------

export function hashPassword(
  password: string,
  salt?: string
): { salt: string; hash: string } {
  const useSalt = salt ?? crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, useSalt, 64).toString("hex");
  return { salt: useSalt, hash: derived };
}

export function verifyPassword(
  password: string,
  salt: string,
  hash: string
): boolean {
  const derived = crypto.scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, "hex");
  if (derived.length !== stored.length) return false;
  return crypto.timingSafeEqual(derived, stored);
}

// ---- Admin user persistence ------------------------------------------------

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function getUser(): Promise<AdminUser> {
  await ensureDir();
  try {
    const raw = await fs.readFile(AUTH_FILE, "utf8");
    return JSON.parse(raw) as AdminUser;
  } catch {
    // Seed a default admin on first run.
    const username = process.env.ADMIN_USERNAME || "admin";
    const password = process.env.ADMIN_PASSWORD || "admin123";
    const { salt, hash } = hashPassword(password);
    const user: AdminUser = { username, salt, hash };
    await fs.writeFile(AUTH_FILE, JSON.stringify(user, null, 2), "utf8");
    return user;
  }
}

async function saveUser(user: AdminUser): Promise<void> {
  await ensureDir();
  await fs.writeFile(AUTH_FILE, JSON.stringify(user, null, 2), "utf8");
}

export async function verifyCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const user = await getUser();
  const userMatch =
    username.length === user.username.length &&
    crypto.timingSafeEqual(
      Buffer.from(username),
      Buffer.from(user.username)
    );
  const passMatch = verifyPassword(password, user.salt, user.hash);
  return userMatch && passMatch;
}

export async function updateUsername(username: string): Promise<void> {
  const user = await getUser();
  await saveUser({ ...user, username });
}

export async function updatePassword(password: string): Promise<void> {
  const user = await getUser();
  const { salt, hash } = hashPassword(password);
  await saveUser({ ...user, salt, hash });
}

// ---- Session tokens --------------------------------------------------------

function sign(payload: string): string {
  return crypto
    .createHmac("sha256", authSecret())
    .update(payload)
    .digest("base64url");
}

export function createSessionToken(username: string): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload = Buffer.from(
    JSON.stringify({ u: username, exp })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string): { username: string } | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = sign(payload);
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (
    sigBuf.length !== expBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expBuf)
  ) {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data.exp !== "number" || data.exp < Date.now() / 1000) {
      return null;
    }
    return { username: String(data.u) };
  } catch {
    return null;
  }
}

// ---- Cookie helpers --------------------------------------------------------

export async function createSession(username: string): Promise<void> {
  const token = createSessionToken(username);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<{ username: string } | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getSession()) !== null;
}
