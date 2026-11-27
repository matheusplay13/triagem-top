import { Link } from "@tanstack/react-router";
import { Crown, Lock, Sparkles } from "lucide-react";
import { useSession } from "@/lib/auth-store";
import { getPlan, minimumPlanFor, type PlanFeature, type PlanId } from "@/lib/plans";

const badgeStyles: Record<PlanId, string> = {
  normal:
    "border-sky-300/80 bg-[linear-gradient(180deg,#ffffff_0%,#dff4ff_100%)] text-sky-900",
  pro: "border-sky-600/80 bg-[linear-gradient(180deg,#64e2ff_0%,#0ea9f5_48%,#007dd8_52%,#20bcf5_100%)] text-white",
  ultra:
    "border-emerald-700/80 bg-[linear-gradient(180deg,#9cf974_0%,#2fd45a_48%,#0ca342_52%,#34db6c_100%)] text-white",
};

/** Selo com o nome do plano da clínica. */
export function PlanBadge({
  planId,
  className = "",
}: {
  planId: string | null | undefined;
  className?: string;
}) {
  const plan = getPlan(planId);
  if (!plan) {
    return (
      <span
        className={`aero-pill inline-flex items-center gap-1 rounded-full border border-rose-400/80 bg-rose-500/90 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-white ${className}`}
      >
        Sem plano
      </span>
    );
  }
  const Icon = plan.id === "normal" ? Sparkles : Crown;
  return (
    <span
      className={`aero-pill inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider ${badgeStyles[plan.id]} ${className}`}
    >
      <Icon className="relative z-10 h-3 w-3" />
      <span className="relative z-10">Plano {plan.name}</span>
    </span>
  );
}

/** Cartão exibido no lugar de um recurso que o plano atual não libera. */
export function LockedFeature({
  feature,
  title,
  description,
  className = "",
}: {
  feature: PlanFeature;
  title: string;
  description: string;
  className?: string;
}) {
  const session = useSession();
  const required = minimumPlanFor(feature);
  const isAdmin = session?.user.role === "admin";

  return (
    <div
      className={`aero-glass relative flex flex-col items-start gap-3 overflow-hidden rounded-3xl p-6 ${className}`}
    >
      <div className="aero-orb flex h-12 w-12 items-center justify-center rounded-2xl">
        <Lock className="relative z-10 h-5 w-5" />
      </div>
      <div>
        <h3 className="font-extrabold text-sky-950">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <span className="aero-pill rounded-full border border-sky-400/70 bg-white/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-sky-800">
        Disponível a partir do plano {required.name}
      </span>
      {isAdmin ? (
        <Link
          to="/clinica"
          className="aero-btn inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold"
        >
          <Crown className="relative z-10 h-4 w-4" />
          <span className="relative z-10">Fazer upgrade</span>
        </Link>
      ) : (
        <p className="text-xs text-muted-foreground">
          Peça ao gestor da clínica para fazer o upgrade.
        </p>
      )}
    </div>
  );
}
