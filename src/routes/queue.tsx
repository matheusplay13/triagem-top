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
    <div className="aero-page pb-16">
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="aero-glass mb-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6">
          <div>
            <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-sky-300/80 bg-white/80 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-sky-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
              <Building2 className="h-3.5 w-3.5 text-sky-600" />
              {activeClinicName ?? "Todas as unidades cadastradas"}
            </div>
            <h1 className="aero-title-gradient text-3xl font-black tracking-tight">
              Painel de atendimento
            </h1>
            <p className="mt-0.5 text-sm font-semibold text-sky-900/75">
              {queue.length} aguardando · {inService.length} em atendimento
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isAuth && clinics.length > 0 && (
              <div className="flex items-center gap-2">
                <label htmlFor="queue-clinic-filter" className="text-xs font-extrabold text-sky-950">
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
                  className="aero-input w-auto min-w-[220px] py-2 text-sm font-bold"
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
                className="aero-btn inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-extrabold"
              >
                <BellRing className="relative z-10 h-4 w-4" />
                <span className="relative z-10">Chamar próximo</span>
              </button>
            )}
          </div>
        </div>

        {/* Now serving */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {inService.length === 0 && (
            <div className="aero-glass col-span-full rounded-3xl p-10 text-center text-sm font-semibold text-sky-900/75">
              Nenhum paciente em atendimento.
              {isAuth && (
                <>
                  {" "}
                  Clique em <strong className="text-sky-950">Chamar próximo</strong> para iniciar.
                </>
              )}
            </div>
          )}
          {inService.map((p) => {
            const incomingTransfer = p.transfers.find(
              (t) => t.destinationUsesSystem && t.toClinicId === p.clinicId && t.fromClinic,
            );
            return (
              <div key={p.id} className="aero-glass overflow-hidden rounded-3xl">
                <div className="aero-gloss-banner flex items-center justify-between gap-2 px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white">
                  <span className="relative z-10 flex items-center gap-2">
                    <Volume2 className="h-3.5 w-3.5" /> Chamando agora
                  </span>
                  {!activeClinicId && p.clinic && (
                    <span className="relative z-10 truncate rounded-full bg-white/25 px-2.5 py-0.5 text-[10px] font-bold normal-case text-white">
                      {p.clinic.name}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <div className="aero-title-gradient text-5xl font-black tracking-tight">
                    {p.ticket}
                  </div>
                  <div className="mt-1 truncate text-base font-extrabold text-sky-950">{p.name}</div>
                  {incomingTransfer?.fromClinic && (
                    <div className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-sky-300/80 bg-sky-100/80 px-2.5 py-0.5 text-[11px] font-bold text-sky-800">
                      <ArrowLeftRight className="h-3 w-3" />
                      Transferido de {incomingTransfer.fromClinic.name}
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <PriorityBadge priority={p.priority} size="sm" />
                    {isAuth && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setTransferTarget(p)}
                          title="Transferir paciente para outro hospital"
                          className="aero-btn-glass inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold"
                        >
                          <ArrowLeftRight className="h-3.5 w-3.5" /> Transferir
                        </button>
                        <button
                          onClick={async () => {
                            await finishPatient(p.id);
                            await refresh();
                          }}
                          className="aero-btn-green inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-extrabold"
                        >
                          <CheckCircle2 className="relative z-10 h-3.5 w-3.5" />
                          <span className="relative z-10">Finalizar</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Queue list */}
        <section className="aero-glass rounded-3xl p-6">
          <h2 className="mb-4 text-xs font-extrabold uppercase tracking-widest text-sky-900/75">
            Fila ordenada por prioridade
          </h2>
          {queue.length === 0 ? (
            <div className="aero-glass-card rounded-2xl p-10 text-center text-sm font-semibold text-sky-900/70">
              Fila vazia{activeClinicName ? ` em ${activeClinicName}` : ""}.
            </div>
          ) : (
            <ol className="space-y-3">
              {queue.map((p, i) => {
                const incomingTransfer = p.transfers.find(
                  (t) => t.destinationUsesSystem && t.toClinicId === p.clinicId && t.fromClinic,
                );
                return (
                  <li
                    key={p.id}
                    className="aero-glass-card flex flex-wrap items-center gap-4 rounded-2xl p-4 transition-transform hover:-translate-y-0.5"
                  >
                    <div className="aero-orb flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black">
                      <span className="relative z-10">{i + 1}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-black text-sky-700">{p.ticket}</span>
                        <span className="truncate font-extrabold text-sky-950">{p.name}</span>
                        <span className="text-xs font-semibold text-muted-foreground">
                          · {p.age} anos
                        </span>
                        {!activeClinicId && p.clinic && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-white/80 px-2.5 py-0.5 text-[11px] font-bold text-sky-800">
                            <Building2 className="h-3 w-3 text-sky-600" /> {p.clinic.name}
                          </span>
                        )}
                        {incomingTransfer?.fromClinic && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-sky-300 bg-sky-100/80 px-2.5 py-0.5 text-[11px] font-bold text-sky-800">
                            <ArrowLeftRight className="h-3 w-3" />
                            Transferido de {incomingTransfer.fromClinic.name}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {p.symptoms}
                      </div>
                    </div>
                    <div className="hidden items-center gap-1.5 rounded-full border border-white/80 bg-white/65 px-2.5 py-1 text-xs font-bold text-sky-900 sm:flex">
                      <Clock className="h-3.5 w-3.5 text-sky-600" />
                      {formatWait(now - p.arrivedAt)}
                    </div>
                    {isAuth && p.lgpdConsent && p.truthfulnessConsent && (
                      <span
                        title="Termos LGPD, Veracidade e Uso Exclusivo assinados pelo paciente"
                        className="hidden items-center gap-1 rounded-full border border-emerald-300/80 bg-emerald-100/80 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 md:inline-flex"
                      >
                        <ShieldCheck className="h-3 w-3 text-emerald-600" /> Termos OK
                      </span>
                    )}
                    <PriorityBadge priority={p.priority} size="sm" />
                    {isAuth && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setTransferTarget(p)}
                          title="Transferir para outro hospital"
                          className="aero-btn-glass rounded-full p-2 text-sky-800"
                        >
                          <ArrowLeftRight className="h-4 w-4" />
                        </button>
                        <button
                          onClick={async () => {
                            await removePatient(p.id);
                            await refresh();
                          }}
                          title="Remover da fila"
                          className="rounded-full border border-rose-200 bg-white/80 p-2 text-rose-600 transition-colors hover:bg-rose-500 hover:text-white"
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
