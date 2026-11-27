// Definição central dos planos (usada tanto no cliente quanto no servidor).
// Os pagamentos são SIMULADOS: nenhuma cobrança real é feita.

export const PLAN_IDS = ["normal", "pro", "ultra"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

/** Recursos que podem ser liberados ou bloqueados conforme o plano. */
export type PlanFeature = "reports" | "csvExport";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  price: string;
  description: string;
  /** Limite de médicos cadastrados. `null` = ilimitado. */
  maxDoctors: number | null;
  features: PlanFeature[];
  highlights: string[];
  popular?: boolean;
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  normal: {
    id: "normal",
    name: "Normal",
    price: "59,99",
    description: "Ideal para clínicas de pequeno porte que precisam de organização.",
    maxDoctors: 3,
    features: [],
    highlights: [
      "Triagem digital com classificação de prioridade",
      "Telão de senhas e fila em tempo real",
      "Até 3 médicos cadastrados",
      "Dashboard básico (contadores e histórico)",
      "Suporte por e-mail",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: "119,99",
    description: "Para clínicas e hospitais em crescimento que buscam eficiência máxima.",
    maxDoctors: 10,
    features: ["reports", "csvExport"],
    highlights: [
      "Tudo do Normal",
      "Até 10 médicos cadastrados",
      "Relatórios: espera média e distribuição por prioridade",
      "Exportação dos atendimentos em CSV",
      "Suporte prioritário (WhatsApp)",
    ],
    popular: true,
  },
  ultra: {
    id: "ultra",
    name: "Ultra",
    price: "249,99",
    description: "Para grandes redes hospitalares com alta demanda de pacientes.",
    maxDoctors: null,
    features: ["reports", "csvExport"],
    highlights: [
      "Tudo do Pro",
      "Médicos ilimitados",
      "API para integração (Sistemas HIS/PEP)",
      "Painéis personalizados (White-label)",
      "Gerente de conta dedicado",
    ],
  },
};

export const PLAN_LIST: PlanDefinition[] = PLAN_IDS.map((id) => PLANS[id]);

export const FEATURE_LABELS: Record<PlanFeature, string> = {
  reports: "Relatórios avançados",
  csvExport: "Exportação em CSV",
};

/** Tabela comparativa exibida na página de planos. */
export const PLAN_COMPARISON: { label: string; values: Record<PlanId, boolean | string> }[] = [
  { label: "Triagem digital", values: { normal: true, pro: true, ultra: true } },
  { label: "Telão de senhas", values: { normal: true, pro: true, ultra: true } },
  { label: "Fila em tempo real", values: { normal: true, pro: true, ultra: true } },
  { label: "Médicos cadastrados", values: { normal: "Até 3", pro: "Até 10", ultra: "Ilimitado" } },
  { label: "Dashboard básico", values: { normal: true, pro: true, ultra: true } },
  { label: "Espera média e distribuição por prioridade", values: { normal: false, pro: true, ultra: true } },
  { label: "Exportação em CSV", values: { normal: false, pro: true, ultra: true } },
  { label: "Suporte", values: { normal: "E-mail", pro: "WhatsApp", ultra: "Gerente dedicado" } },
  { label: "API de integração e White-label", values: { normal: false, pro: false, ultra: true } },
];

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && (PLAN_IDS as readonly string[]).includes(value);
}

/** Retorna o plano ou `null` caso a clínica não tenha um plano válido. */
export function getPlan(id: string | null | undefined): PlanDefinition | null {
  return isPlanId(id) ? PLANS[id] : null;
}

export function hasFeature(plan: PlanDefinition | null, feature: PlanFeature): boolean {
  return !!plan && plan.features.includes(feature);
}

/** Plano mais barato que libera o recurso. */
export function minimumPlanFor(feature: PlanFeature): PlanDefinition {
  return PLAN_LIST.find((p) => p.features.includes(feature)) ?? PLANS.ultra;
}

export function planRank(id: PlanId): number {
  return PLAN_IDS.indexOf(id);
}

export function doctorLimitLabel(plan: PlanDefinition): string {
  return plan.maxDoctors === null ? "Ilimitado" : String(plan.maxDoctors);
}

export function canAddDoctor(plan: PlanDefinition | null, currentDoctors: number): boolean {
  if (!plan) return false;
  return plan.maxDoctors === null || currentDoctors < plan.maxDoctors;
}
