import { useQuery } from "@tanstack/react-query";
import { useSession } from "./auth-store";
import { getMyPlanFn } from "./api/clinic.functions";
import { getPlan, hasFeature, type PlanFeature } from "./plans";

/** Plano atual da clínica do usuário logado (gestor ou médico). */
export function useClinicPlan() {
  const session = useSession();
  const query = useQuery({
    queryKey: ["my-plan", session?.token],
    queryFn: () => getMyPlanFn({ data: { token: session!.token } }),
    enabled: !!session,
    retry: false,
    staleTime: 30_000,
  });

  const plan = getPlan(query.data?.plan);
  return {
    plan,
    doctors: query.data?.doctors ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    can: (feature: PlanFeature) => hasFeature(plan, feature),
  };
}
