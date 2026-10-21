import { useSyncExternalStore } from "react";

const AUTH_KEY = "triage-auth-session";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "doctor";
  clinicId: string;
  clinicName: string;
}

export interface Session {
  token: string;
  user: SessionUser;
}

function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

let session = loadSession();
const listeners = new Set<() => void>();

function emit() {
  if (typeof window !== "undefined") {
    if (session) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  }
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === AUTH_KEY) {
      session = loadSession();
      listeners.forEach((l) => l());
    }
  });
}

export function subscribeAuth(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function getSessionSnapshot() {
  return session;
}

export function getAuthSnapshot() {
  return session !== null;
}

/** Sessão completa (token + usuário) ou null. */
export function useSession() {
  return useSyncExternalStore(subscribeAuth, getSessionSnapshot, () => null);
}

/** true se houver qualquer usuário logado (gestor ou médico). */
export function useAuth() {
  return useSyncExternalStore(subscribeAuth, getAuthSnapshot, () => false);
}

export function login(newSession: Session) {
  session = newSession;
  emit();
}

export function logout() {
  session = null;
  emit();
}
