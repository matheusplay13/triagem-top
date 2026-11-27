import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AppNav } from "@/components/AppNav";
import { PriorityBadge } from "@/components/PriorityBadge";
import { clearAll, usePatients, type Priority } from "@/lib/triage-store";
import { useSession } from "@/lib/auth-store";
import {
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  Building2,
  CheckCircle2,
  Trash2,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Sem Espera" },
      { name: "description", content: "Métricas e histórico de atendimentos da unidade." },
    ],
  }),
  component: DashboardPage,
});

function avgWait(durations: number[]) {
  if (!durations.length) return 0;
  return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 60000);
}

function DashboardPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const session = useSession();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (hydrated && !session) {
      navigate({ to: "/login", replace: true });
    }
  }, [hydrated, session, navigate]);

  const patients = usePatients(session?.user.clinicId);

  if (!hydrated || !session) return null;

  const waiting = patients.filter((p) => p.status === "waiting");
  const inService = patients.filter((p) => p.status === "in_service");
  const done = patients.filter((p) => p.status === "done");
  const transferred = patients.filter((p) => p.status === "transferred");
  const finishedOrTransferred = patients.filter(
    (p) => p.status === "done" || p.status === "transferred",
  );

  const waitTimes = done
    .filter((p) => p.calledAt)
    .map((p) => p.calledAt! - p.arrivedAt);
  const avgWaitMin = avgWait(waitTimes);

  const byPriority: Record<Priority, number> = {
    high: patients.filter((p) => p.priority === "high").length,
    medium: patients.filter((p) => p.priority === "medium").length,
    low: patients.filter((p) => p.priority === "low").length,
  };
  const total = patients.length || 1;

  return (
    <div className="aero-page pb-16">
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="aero-glass mb-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6">
          <div>
            <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-sky-300/80 bg-white/80 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-sky-800">
              <Building2 className="h-3.5 w-3.5 text-sky-600" /> {session.user.clinicName}
            </div>
            <h1 className="aero-title-gradient text-3xl font-black tracking-tight">Dashboard</h1>
            <p className="text-sm font-semibold text-sky-900/75">
              Métricas e histórico do atendimento da unidade.
            </p>
          </div>
          {patients.length > 0 && (
            <button
              onClick={async () => {
                if (confirm(`Limpar todos os atendimentos de ${session.user.clinicName}?`)) {
                  await clearAll(session.user.clinicId);
                  await qc.invalidateQueries({ queryKey: ["patients"] });
                }
              }}
              className="rounded-full border border-rose-300/90 bg-white/80 px-4 py-2 text-xs font-extrabold text-rose-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] transition-all hover:bg-rose-500 hover:text-white inline-flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" /> Limpar fila da unidade
            </button>
          )}
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Stat icon={Users} label="Aguardando" value={waiting.length} orb="aero-orb" />
          <Stat icon={Activity} label="Em atendimento" value={inService.length} orb="aero-orb-amber" />
          <Stat icon={CheckCircle2} label="Atendidos" value={done.length} orb="aero-orb-green" />
          <Stat
            icon={ArrowLeftRight}
            label="Transferidos (ext.)"
            value={transferred.length}
            orb="aero-orb"
          />
          <Stat icon={AlertTriangle} label="Espera média" value={`${avgWaitMin} min`} orb="aero-orb-red" />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="aero-glass rounded-3xl p-6">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-sky-900/75">
              Distribuição por prioridade
            </h2>
            <div className="mt-5 space-y-5">
              {(["high", "medium", "low"] as Priority[]).map((pr) => {
                const pct = Math.round((byPriority[pr] / total) * 100);
                const barCls =
                  pr === "high"
                    ? "bg-[linear-gradient(180deg,#ff7d95_0%,#eb2549_50%,#c20a2c_100%)]"
                    : pr === "medium"
                      ? "bg-[linear-gradient(180deg,#fff08a_0%,#ffc226_50%,#eb8b00_100%)]"
                      : "bg-[linear-gradient(180deg,#9cf974_0%,#25c956_50%,#0da140_100%)]";
                return (
                  <div key={pr}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <PriorityBadge priority={pr} size="sm" />
                      <span className="font-extrabold text-sky-950">
                        {byPriority[pr]} ({pct}%)
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full border border-white/90 bg-sky-100/80 shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barCls}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="aero-glass rounded-3xl p-6">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-sky-900/75">
              Histórico recente (finalizados e transferidos)
            </h2>
            {finishedOrTransferred.length === 0 ? (
              <p className="mt-6 text-sm font-semibold text-sky-900/70">
                Nenhum atendimento finalizado ou transferido ainda.
              </p>
            ) : (
              <ul className="mt-4 max-h-80 space-y-2.5 overflow-y-auto pr-1">
                {[...finishedOrTransferred]
                  .reverse()
                  .slice(0, 20)
                  .map((p) => {
                    const lastTransfer = p.transfers[0];
                    return (
                      <li
                        key={p.id}
                        className="aero-glass-card flex flex-wrap items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm"
                      >
                        <span className="font-black text-sky-700">{p.ticket}</span>
                        <span className="min-w-0 flex-1 truncate font-bold text-sky-950">
                          {p.name}
                        </span>
                        {p.status === "transferred" ? (
                          <span className="rounded-full border border-amber-400 bg-amber-100/85 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                            Transferido
                            {lastTransfer?.externalHospitalName
                              ? `: ${lastTransfer.externalHospitalName}`
                              : ""}
                          </span>
                        ) : (
                          <span className="rounded-full border border-emerald-400/80 bg-emerald-100/85 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                            Finalizado
                          </span>
                        )}
                        <PriorityBadge priority={p.priority} size="sm" />
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  orb,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  orb: "aero-orb" | "aero-orb-green" | "aero-orb-amber" | "aero-orb-red";
}) {
  return (
    <div className="aero-glass rounded-3xl p-5">
      <div className={`${orb} inline-flex h-11 w-11 items-center justify-center rounded-2xl`}>
        <Icon className="relative z-10 h-5 w-5 text-white" />
      </div>
      <div className="aero-title-gradient mt-3 text-3xl font-black tracking-tight">{value}</div>
      <div className="text-[11px] font-extrabold uppercase tracking-wider text-sky-900/70">
        {label}
      </div>
    </div>
  );
}
