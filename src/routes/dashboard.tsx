import { createFileRoute } from "@tanstack/react-router";
import { AppNav } from "@/components/AppNav";
import { PriorityBadge } from "@/components/PriorityBadge";
import { clearAll, usePatients, type Priority } from "@/lib/triage-store";
import { Activity, AlertTriangle, CheckCircle2, Trash2, Users } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — TriageFlow" },
      { name: "description", content: "Métricas e histórico de atendimentos." },
    ],
  }),
  component: DashboardPage,
});

function avgWait(durations: number[]) {
  if (!durations.length) return 0;
  return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 60000);
}

function DashboardPage() {
  const patients = usePatients();
  const waiting = patients.filter((p) => p.status === "waiting");
  const inService = patients.filter((p) => p.status === "in_service");
  const done = patients.filter((p) => p.status === "done");

  const waitTimes = done
    .filter((p) => p.calledAt)
    .map((p) => (p.calledAt! - p.arrivedAt));
  const avgWaitMin = avgWait(waitTimes);

  const byPriority: Record<Priority, number> = {
    high: patients.filter((p) => p.priority === "high").length,
    medium: patients.filter((p) => p.priority === "medium").length,
    low: patients.filter((p) => p.priority === "low").length,
  };
  const total = patients.length || 1;

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Métricas e histórico do atendimento.</p>
          </div>
          {patients.length > 0 && (
            <button
              onClick={() => confirm("Limpar todos os dados?") && clearAll()}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" /> Limpar tudo
            </button>
          )}
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={Users} label="Aguardando" value={waiting.length} tone="primary" />
          <Stat icon={Activity} label="Em atendimento" value={inService.length} tone="medium" />
          <Stat icon={CheckCircle2} label="Atendidos" value={done.length} tone="low" />
          <Stat icon={AlertTriangle} label="Espera média" value={`${avgWaitMin} min`} tone="high" />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-2xl border border-border bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Distribuição por prioridade
            </h2>
            <div className="mt-4 space-y-4">
              {(["high", "medium", "low"] as Priority[]).map((pr) => {
                const pct = Math.round((byPriority[pr] / total) * 100);
                return (
                  <div key={pr}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <PriorityBadge priority={pr} size="sm" />
                      <span className="font-medium">{byPriority[pr]} ({pct}%)</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full ${pr === "high" ? "bg-priority-high" : pr === "medium" ? "bg-priority-medium" : "bg-priority-low"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Histórico recente
            </h2>
            {done.length === 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">Nenhum atendimento finalizado ainda.</p>
            ) : (
              <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
                {[...done].reverse().slice(0, 20).map((p) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
                    <span className="font-bold text-primary">{p.ticket}</span>
                    <span className="flex-1 truncate">{p.name}</span>
                    <PriorityBadge priority={p.priority} size="sm" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({
  icon: Icon, label, value, tone,
}: {
  icon: typeof Users; label: string; value: number | string;
  tone: "primary" | "high" | "medium" | "low";
}) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    high: "bg-priority-high/15 text-priority-high",
    medium: "bg-priority-medium/20 text-priority-medium",
    low: "bg-priority-low/15 text-priority-low",
  }[tone];
  return (
    <div className="rounded-2xl border border-border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${toneCls}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
