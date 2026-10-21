import process from "node:process";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Server-only helpers for password hashing and signed session tokens.
// Uses only node:crypto (no extra dependencies).

export type Role = "admin" | "doctor";

export interface SessionPayload {
  userId: string;
  clinicId: string;
  role: Role;
  exp: number;
}

const TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12 horas

function getSecret() {
  return process.env.AUTH_SECRET || "sem-espera-dev-secret-troque-em-producao";
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function sign(data: string) {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

export function createToken(payload: Omit<SessionPayload, "exp">): string {
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp: Date.now() + TOKEN_TTL_MS }),
  ).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = Buffer.from(sign(body));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function requireRole(token: string, roles: Role[]): SessionPayload {
  const session = verifyToken(token);
  if (!session) throw new Error("Sessão inválida ou expirada. Faça login novamente.");
  if (!roles.includes(session.role)) throw new Error("Acesso negado.");
  return session;
}
