import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { PriorityBadge } from "@/components/PriorityBadge";
import {
  callNext, finishPatient, removePatient, sortedQueue, usePatients,
} from "@/lib/triage-store";
import { BellRing, CheckCircle2, Clock, UserMinus, Volume2 } from "lucide-react";

export const Route = createFileRoute("/queue")({
  head: () => ({
    meta: [
      { title: "Fila e Painel — TriageFlow" },
      { name: "description", content: "Painel ao vivo da fila de atendimento ordenada por prioridade." },
    ],
  }),
  component: QueuePage,
});

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

function formatWait(ms: number) {
  const m = Math.floor(ms / 60000);
  if (m < 1) return "< 1 min";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}min`;
}

function QueuePage() {
  const patients = usePatients();
  const now = useNow();
  const queue = sortedQueue(patients);
  const inService = patients.filter((p) => p.status === "in_service");

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Painel de atendimento</h1>
            <p className="text-sm text-muted-foreground">
              {queue.length} aguardando · {inService.length} em atendimento
            </p>
          </div>
          <button
            onClick={() => callNext()}
            disabled={queue.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90"
            style={{ boxShadow: queue.length ? "var(--shadow-soft)" : undefined }}
          >
            <BellRing className="h-4 w-4" />
            Chamar próximo
          </button>
        </div>

        {/* Now serving */}
        <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {inService.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
              Nenhum paciente em atendimento. Clique em <strong>Chamar próximo</strong> para iniciar.
            </div>
          )}
          {inService.map((p) => (
            <div key={p.id} className="rounded-2xl border border-primary/30 bg-card p-5" style={{ boxShadow: "var(--shadow-soft)" }}>
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary">
                <Volume2 className="h-3.5 w-3.5" /> Chamando agora
              </div>
              <div className="mt-2 text-4xl font-black tracking-tight text-primary">{p.ticket}</div>
              <div className="mt-1 truncate text-base font-semibold">{p.name}</div>
              <div className="mt-3 flex items-center justify-between">
                <PriorityBadge priority={p.priority} size="sm" />
                <button
                  onClick={() => finishPatient(p.id)}
                  className="inline-flex items-center gap-1 rounded-md bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground hover:opacity-90"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Finalizar
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* Queue list */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Fila ordenada por prioridade
          </h2>
          {queue.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
              Fila vazia.
            </div>
          ) : (
            <ol className="space-y-2">
              {queue.map((p, i) => (
                <li
                  key={p.id}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">{p.ticket}</span>
                      <span className="truncate font-medium">{p.name}</span>
                      <span className="text-xs text-muted-foreground">· {p.age} anos</span>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">{p.symptoms}</div>
                  </div>
                  <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                    <Clock className="h-3.5 w-3.5" />
                    {formatWait(now - p.arrivedAt)}
                  </div>
                  <PriorityBadge priority={p.priority} size="sm" />
                  <button
                    onClick={() => removePatient(p.id)}
                    title="Remover da fila"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <UserMinus className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>
    </div>
  );
}
