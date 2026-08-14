import { useSyncExternalStore } from "react";

const AUTH_KEY = "triage-auth-token";

function loadAuth() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(AUTH_KEY) === "true";
}

let isAuth = loadAuth();
const listeners = new Set<() => void>();

function emit() {
  if (typeof window !== "undefined") {
    if (isAuth) {
      localStorage.setItem(AUTH_KEY, "true");
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  }
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === AUTH_KEY) {
      isAuth = loadAuth();
      listeners.forEach((l) => l());
    }
  });
}

export function subscribeAuth(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function getAuthSnapshot() {
  return isAuth;
}

export function useAuth() {
  return useSyncExternalStore(subscribeAuth, getAuthSnapshot, () => false);
}

export function login() {
  isAuth = true;
  emit();
}

export function logout() {
  isAuth = false;
  emit();
}
