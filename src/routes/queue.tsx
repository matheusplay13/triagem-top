import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AppNav } from "@/components/AppNav";
import { PriorityBadge } from "@/components/PriorityBadge";
import { TransferPatientModal } from "@/components/TransferPatientModal";
import {
  callNext,
  finishPatient,
  removePatient,
  sortedQueue,
  usePatients,
  usePublicClinics,
  type Patient,
} from "@/lib/triage-store";
import { useSession } from "@/lib/auth-store";
import {
  ArrowLeftRight,
  BellRing,
  Building2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  UserMinus,
  Volume2,
} from "lucide-react";

export const Route = createFileRoute("/queue")({
  validateSearch: (search: Record<string, unknown>): { clinicId?: string } => ({
    clinicId: typeof search.clinicId === "string" && search.clinicId ? search.clinicId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Fila e Painel — Sem Espera" },
      { name: "description", content: "Painel ao vivo da fila de atendimento ordenada por prioridade por hospital." },
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
  const navigate = useNavigate();
  const qc = useQueryClient();
  const search = Route.useSearch();
  const session = useSession();
  const isAuth = !!session;

  const clinicsQuery = usePublicClinics();
  const clinics = clinicsQuery.data ?? [];

  const activeClinicId = session?.user.clinicId ?? search.clinicId;
  const activeClinicName =
    session?.user.clinicName ??
    clinics.find((c) => c.id === activeClinicId)?.name ??
    null;

  const patients = usePatients(activeClinicId);
  const now = useNow();
  const queue = sortedQueue(patients);
  const inService = patients.filter((p) => p.status === "in_service");

  const [transferTarget, setTransferTarget] = useState<Patient | null>(null);

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["patients"] });
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <Building2 className="h-3.5 w-3.5" />
              {activeClinicName ?? "Todas as unidades cadastradas"}
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Painel de atendimento</h1>
            <p className="text-sm text-muted-foreground">
              {queue.length} aguardando · {inService.length} em atendimento
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isAuth && clinics.length > 0 && (
              <div className="flex items-center gap-2">
                <label htmlFor="queue-clinic-filter" className="text-xs font-bold text-muted-foreground">
                  Hospital:
                </label>
                <select
                  id="queue-clinic-filter"
                  value={search.clinicId ?? ""}
                  onChange={(e) =>
                    navigate({
                      to: "/queue",
                      search: { clinicId: e.target.value || undefined },
                    })
                  }
                  className="rounded-xl border border-input bg-card px-3 py-2 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Todos os hospitais</option>
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.waitingCount} aguardando)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isAuth && (
              <button
                onClick={async () => {
                  await callNext(patients);
                  await refresh();
                }}
                disabled={queue.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ boxShadow: queue.length ? "var(--shadow-soft)" : undefined }}
              >
                <BellRing className="h-4 w-4" />
                Chamar próximo
              </button>
            )}
          </div>
        </div>

        {/* Now serving */}
        <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {inService.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
              Nenhum paciente em atendimento.
              {isAuth && (
                <>
                  {" "}
                  Clique em <strong>Chamar próximo</strong> para iniciar.
                </>
              )}
            </div>
          )}
          {inService.map((p) => {
            const incomingTransfer = p.transfers.find(
              (t) => t.destinationUsesSystem && t.toClinicId === p.clinicId && t.fromClinic,
            );
            return (
              <div
                key={p.id}
                className="rounded-2xl border border-primary/30 bg-card p-5"
                style={{ boxShadow: "var(--shadow-soft)" }}
              >
                <div className="flex items-center justify-between gap-2 text-xs uppercase tracking-wider text-primary">
                  <span className="flex items-center gap-2">
                    <Volume2 className="h-3.5 w-3.5" /> Chamando agora
                  </span>
                  {!activeClinicId && p.clinic && (
                    <span className="truncate rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold normal-case text-muted-foreground">
                      {p.clinic.name}
                    </span>
                  )}
                </div>
                <div className="mt-2 text-4xl font-black tracking-tight text-primary">{p.ticket}</div>
                <div className="mt-1 truncate text-base font-semibold">{p.name}</div>
                {incomingTransfer?.fromClinic && (
                  <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    <ArrowLeftRight className="h-3 w-3" />
                    Transferido de {incomingTransfer.fromClinic.name}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <PriorityBadge priority={p.priority} size="sm" />
                  {isAuth && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setTransferTarget(p)}
                        title="Transferir paciente para outro hospital"
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                      >
                        <ArrowLeftRight className="h-3.5 w-3.5" /> Transferir
                      </button>
                      <button
                        onClick={async () => {
                          await finishPatient(p.id);
                          await refresh();
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground hover:opacity-90"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Finalizar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {/* Queue list */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Fila ordenada por prioridade
          </h2>
          {queue.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
              Fila vazia{activeClinicName ? ` em ${activeClinicName}` : ""}.
            </div>
          ) : (
            <ol className="space-y-2">
              {queue.map((p, i) => {
                const incomingTransfer = p.transfers.find(
                  (t) => t.destinationUsesSystem && t.toClinicId === p.clinicId && t.fromClinic,
                );
                return (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4"
                    style={{ boxShadow: "var(--shadow-card)" }}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground">
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-bold text-primary">{p.ticket}</span>
                        <span className="truncate font-medium">{p.name}</span>
                        <span className="text-xs text-muted-foreground">· {p.age} anos</span>
                        {!activeClinicId && p.clinic && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            <Building2 className="h-3 w-3" /> {p.clinic.name}
                          </span>
                        )}
                        {incomingTransfer?.fromClinic && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                            <ArrowLeftRight className="h-3 w-3" />
                            Transferido de {incomingTransfer.fromClinic.name}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {p.symptoms}
                      </div>
                    </div>
                    <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                      <Clock className="h-3.5 w-3.5" />
                      {formatWait(now - p.arrivedAt)}
                    </div>
                    {isAuth && p.lgpdConsent && p.truthfulnessConsent && (
                      <span
                        title="Termos LGPD, Veracidade e Uso Exclusivo assinados pelo paciente"
                        className="hidden items-center gap-1 rounded-full bg-priority-low/10 px-2 py-0.5 text-[11px] font-semibold text-priority-low md:inline-flex"
                      >
                        <ShieldCheck className="h-3 w-3" /> Termos OK
                      </span>
                    )}
                    <PriorityBadge priority={p.priority} size="sm" />
                    {isAuth && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setTransferTarget(p)}
                          title="Transferir para outro hospital"
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        >
                          <ArrowLeftRight className="h-4 w-4" />
                        </button>
                        <button
                          onClick={async () => {
                            await removePatient(p.id);
                            await refresh();
                          }}
                          title="Remover da fila"
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <UserMinus className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </main>

      {session && (
        <TransferPatientModal
          patient={transferTarget}
          token={session.token}
          currentClinicId={session.user.clinicId}
          currentClinicName={session.user.clinicName}
          onClose={() => setTransferTarget(null)}
        />
      )}
    </div>
  );
}
