import { Link } from "@tanstack/react-router";
import { Crown, Lock, Sparkles } from "lucide-react";
import { useSession } from "@/lib/auth-store";
import { getPlan, minimumPlanFor, type PlanFeature, type PlanId } from "@/lib/plans";

const badgeStyles: Record<PlanId, string> = {
  normal: "bg-muted text-foreground border-border",
  pro: "bg-primary/10 text-primary border-primary/30",
  ultra: "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400",
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
        className={`inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-destructive ${className}`}
      >
        Sem plano
      </span>
    );
  }
  const Icon = plan.id === "normal" ? Sparkles : Crown;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${badgeStyles[plan.id]} ${className}`}
    >
      <Icon className="h-3 w-3" /> Plano {plan.name}
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
      className={`relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6 ${className}`}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <Lock className="h-5 w-5" />
      </div>
      <div>
        <h3 className="font-bold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
        Disponível a partir do plano {required.name}
      </span>
      {isAdmin ? (
        <Link
          to="/clinica"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-95"
        >
          <Crown className="h-4 w-4" /> Fazer upgrade
        </Link>
      ) : (
        <p className="text-xs text-muted-foreground">
          Peça ao gestor da clínica para fazer o upgrade.
        </p>
      )}
    </div>
  );
}
