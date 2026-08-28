import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPatientsFn,
  createPatientFn,
  updatePatientStatusFn,
  removePatientFn,
  clearAllFn,
} from "./api/triage.functions";

export type Priority = "high" | "medium" | "low";
export type PatientStatus = "waiting" | "in_service" | "done";

export interface Patient {
  id: string;
  name: string;
  age: number;
  document: string;
  symptoms: string;
  painLevel: number;
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

export function usePatients(): Patient[] {
  const { data } = useQuery({
    queryKey: ["patients"],
    queryFn: () => getPatientsFn(),
    refetchInterval: 2000, // Atualiza a cada 2 segundos
  });

  // Normalizamos as datas do Prisma (strings iso) para timestamps (numbers) como o frontend espera
  return (data ?? []).map((p) => ({
    ...p,
    priority: p.priority as Priority,
    status: p.status as PatientStatus,
    arrivedAt: new Date(p.arrivedAt).getTime(),
    calledAt: p.calledAt ? new Date(p.calledAt).getTime() : undefined,
    finishedAt: p.finishedAt ? new Date(p.finishedAt).getTime() : undefined,
  }));
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
  if (t.hasChestPain || t.hasBreathingIssue || t.painLevel >= 8) return "high";
  if (t.age >= 65 || t.age <= 2) return "high";
  if (t.hasFever && t.painLevel >= 5) return "high";
  if (t.painLevel >= 5 || t.hasFever) return "medium";
  if (t.age >= 60) return "medium";
  return "low";
}

export async function addPatient(input: TriageInput): Promise<Patient> {
  const priority = classifyPriority(input);
  const result = await createPatientFn({
    data: { ...input, priority },
  });
  return {
    ...result,
    priority: result.priority as Priority,
    status: result.status as PatientStatus,
    arrivedAt: new Date(result.arrivedAt).getTime(),
  };
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

export async function callNext(patients: Patient[]): Promise<void> {
  const queue = sortedQueue(patients);
  if (!queue.length) return;
  const next = queue[0];
  await updatePatientStatusFn({ data: { id: next.id, status: "in_service" } });
}

export async function finishPatient(id: string): Promise<void> {
  await updatePatientStatusFn({ data: { id, status: "done" } });
}

export async function removePatient(id: string): Promise<void> {
  await removePatientFn({ data: { id } });
}

export async function clearAll(): Promise<void> {
  await clearAllFn();
}

export const priorityLabel: Record<Priority, string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};
