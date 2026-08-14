import { useSyncExternalStore } from "react";

export type Priority = "high" | "medium" | "low";
export type PatientStatus = "waiting" | "in_service" | "done";

export interface Patient {
  id: string;
  name: string;
  age: number;
  document: string;
  symptoms: string;
  painLevel: number; // 0-10
  hasFever: boolean;
  hasBreathingIssue: boolean;
  hasChestPain: boolean;
  priority: Priority;
  status: PatientStatus;
  arrivedAt: number;
  calledAt?: number;
  finishedAt?: number;
  ticket: string;
}

const STORAGE_KEY = "triage-queue-v1";
const COUNTER_KEY = "triage-counter-v1";

function load(): Patient[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Patient[]) : [];
  } catch {
    return [];
  }
}

function save(list: Patient[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

let state: Patient[] = load();
const listeners = new Set<() => void>();

function emit() {
  save(state);
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      state = load();
      listeners.forEach((l) => l());
    }
  });
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function getSnapshot(): Patient[] {
  return state;
}

export function usePatients(): Patient[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => []);
}

function nextTicket(): string {
  if (typeof window === "undefined") return "T001";
  const n = Number(localStorage.getItem(COUNTER_KEY) || "0") + 1;
  localStorage.setItem(COUNTER_KEY, String(n));
  return `T${String(n).padStart(3, "0")}`;
}

export interface TriageInput {
  name: string;
  age: number;
  document: string;
  symptoms: string;
  painLevel: number;
  hasFever: boolean;
  hasBreathingIssue: boolean;
  hasChestPain: boolean;
}

export function classifyPriority(t: TriageInput): Priority {
  // Critical red flags
  if (t.hasChestPain || t.hasBreathingIssue || t.painLevel >= 8) return "high";
  if (t.age >= 65 || t.age <= 2) return "high";
  if (t.hasFever && t.painLevel >= 5) return "high";

  if (t.painLevel >= 5 || t.hasFever) return "medium";
  if (t.age >= 60) return "medium";

  return "low";
}

export function addPatient(input: TriageInput): Patient {
  const priority = classifyPriority(input);
  const patient: Patient = {
    id: crypto.randomUUID(),
    ...input,
    priority,
    status: "waiting",
    arrivedAt: Date.now(),
    ticket: nextTicket(),
  };
  state = [...state, patient];
  emit();
  return patient;
}

const priorityRank: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export function sortedQueue(list: Patient[]): Patient[] {
  return list
    .filter((p) => p.status === "waiting")
    .sort((a, b) => {
      if (priorityRank[a.priority] !== priorityRank[b.priority]) {
        return priorityRank[a.priority] - priorityRank[b.priority];
      }
      return a.arrivedAt - b.arrivedAt;
    });
}

export function callNext(): Patient | null {
  const queue = sortedQueue(state);
  if (!queue.length) return null;
  const next = queue[0];
  state = state.map((p) =>
    p.id === next.id ? { ...p, status: "in_service", calledAt: Date.now() } : p,
  );
  emit();
  return next;
}

export function finishPatient(id: string) {
  state = state.map((p) =>
    p.id === id ? { ...p, status: "done", finishedAt: Date.now() } : p,
  );
  emit();
}

export function removePatient(id: string) {
  state = state.filter((p) => p.id !== id);
  emit();
}

export function clearAll() {
  state = [];
  if (typeof window !== "undefined") localStorage.removeItem(COUNTER_KEY);
  emit();
}

export const priorityLabel: Record<Priority, string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};
