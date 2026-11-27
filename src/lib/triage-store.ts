import { useQuery } from "@tanstack/react-query";
import {
  getPatientsFn,
  getPublicClinicsFn,
  createPatientFn,
  updatePatientStatusFn,
  removePatientFn,
  clearAllFn,
} from "./api/triage.functions";

export type Priority = "high" | "medium" | "low";
export type PatientStatus = "waiting" | "in_service" | "done" | "transferred";

export interface ClinicSummary {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
}

export interface PublicClinic extends ClinicSummary {
  exclusiveUseAccepted: boolean;
  waitingCount: number;
}

export interface PatientTransferSummary {
  id: string;
  protocol: string;
  fromClinicId: string | null;
  toClinicId: string | null;
  destinationUsesSystem: boolean;
  externalHospitalName: string | null;
  externalHospitalAddress: string | null;
  externalHospitalPhone: string | null;
  reason: string;
  clinicalNotes: string | null;
  transferredBy: string | null;
  status: string;
  createdAt: string | Date;
  fromClinic: ClinicSummary | null;
  toClinic: ClinicSummary | null;
}

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
  clinicId: string | null;
  clinic: ClinicSummary | null;
  lgpdConsent: boolean;
  truthfulnessConsent: boolean;
  exclusiveSystemConsent: boolean;
  termsAcceptedAt?: number;
  transfers: PatientTransferSummary[];
}

export function usePublicClinics() {
  return useQuery({
    queryKey: ["public-clinics"],
    queryFn: () => getPublicClinicsFn(),
    refetchInterval: 10000,
  });
}

export function usePatients(clinicId?: string): Patient[] {
  const { data } = useQuery({
    queryKey: ["patients", clinicId ?? "all"],
    queryFn: () => getPatientsFn({ data: clinicId ? { clinicId } : undefined }),
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
    termsAcceptedAt: p.termsAcceptedAt ? new Date(p.termsAcceptedAt).getTime() : undefined,
    transfers: p.transfers ?? [],
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
  clinicId: string;
  lgpdConsent: true;
  truthfulnessConsent: true;
  exclusiveSystemConsent: true;
}

export function classifyPriority(t: Pick<TriageInput, "age" | "painLevel" | "hasFever" | "hasBreathingIssue" | "hasChestPain">): Priority {
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
    calledAt: undefined,
    finishedAt: undefined,
    termsAcceptedAt: result.termsAcceptedAt ? new Date(result.termsAcceptedAt).getTime() : undefined,
    transfers: result.transfers ?? [],
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

export async function clearAll(clinicId?: string): Promise<void> {
  await clearAllFn({ data: clinicId ? { clinicId } : undefined });
}

export const priorityLabel: Record<Priority, string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};
