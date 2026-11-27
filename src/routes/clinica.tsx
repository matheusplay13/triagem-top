import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppNav } from "@/components/AppNav";
import { PriorityBadge } from "@/components/PriorityBadge";
import {
  TransferPatientModal,
  printTransferReport,
} from "@/components/TransferPatientModal";
import { logout, useSession } from "@/lib/auth-store";
import {
  callNext,
  finishPatient,
  priorityLabel,
  removePatient,
  sortedQueue,
  usePatients,
  type Patient,
  type Priority,
} from "@/lib/triage-store";
import {
  createDoctorFn,
  getClinicFn,
  removeDoctorFn,
  resetDoctorPasswordFn,
  toggleDoctorFn,
} from "@/lib/api/clinic.functions";
import { getTransfersFn } from "@/lib/api/triage.functions";
import { formatTransferReportText, type TransferReportInput } from "@/lib/legal";
import {
  Activity,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  KeyRound,
  ListOrdered,
  Loader2,
  Megaphone,
  Power,
  Printer,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/clinica")({
  head: () => ({
    meta: [
      { title: "Gerenciamento da Clínica — Sem Espera" },
      {
        name: "description",
        content:
          "Painel do gestor: filas em tempo real, transferências hospitalares e gestão de médicos.",
      },
    ],
  }),
  component: ClinicaPage,
});

type Tab = "filas" | "transferencias" | "medicos";

function ClinicaPage() {
  const navigate = useNavigate();
  const session = useSession();
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<Tab>("filas");

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (!hydrated) return;
    if (!session) navigate({ to: "/login", replace: true });
    else if (session.user.role !== "admin") navigate({ to: "/dashboard", replace: true });
  }, [hydrated, session, navigate]);

  const clinicQuery = useQuery({
    queryKey: ["clinic", session?.token],
    queryFn: () => getClinicFn({ data: { token: session!.token } }),
    enabled: !!session && session.user.role === "admin",
    retry: false,
  });

  const transfersQuery = useQuery({
    queryKey: ["transfers", session?.token],
    queryFn: () => getTransfersFn({ data: { token: session!.token } }),
    enabled: !!session && session.user.role === "admin",
    refetchInterval: 5000,
    retry: false,
  });

  useEffect(() => {
    if (clinicQuery.error) {
      logout();
      navigate({ to: "/login", replace: true });
    }
  }, [clinicQuery.error, navigate]);

  if (!hydrated || !session || session.user.role !== "admin") return null;

  const clinic = clinicQuery.data?.clinic;
  const doctors = (clinicQuery.data?.staff ?? []).filter((u) => u.role === "doctor");
  const transfers = transfersQuery.data ?? [];
  const clinicName = clinic?.name ?? session.user.clinicName;

  return (
    <div className="aero-page pb-16">
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <header className="aero-glass mb-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <div className="aero-orb flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl">
              <Building2 className="relative z-10 h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-sky-800/75">
                Gerenciamento da clínica
              </p>
              <h1 className="aero-title-gradient text-2xl font-black tracking-tight sm:text-3xl">
                {clinicName}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold text-sky-900/75">
                <span>Gestor: {session.user.name}</span>
                {clinic?.termsAccepted && clinic?.exclusiveUseAccepted && (
                  <span className="aero-pill inline-flex items-center gap-1 rounded-full border border-emerald-700/80 bg-[linear-gradient(180deg,#9cf974_0%,#25c956_50%,#0da140_100%)] px-3 py-0.5 text-[11px] font-extrabold text-white">
                    <ShieldCheck className="relative z-10 h-3 w-3" />
                    <span className="relative z-10">LGPD e Uso Exclusivo Ativos</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div
            className="aero-glass-card flex flex-wrap gap-1 rounded-full p-1.5"
            role="tablist"
          >
            <TabButton
              id="tab-filas"
              active={tab === "filas"}
              onClick={() => setTab("filas")}
              icon={ListOrdered}
            >
              Filas
            </TabButton>
            <TabButton
              id="tab-transferencias"
              active={tab === "transferencias"}
              onClick={() => setTab("transferencias")}
              icon={ArrowLeftRight}
            >
              Transferências{" "}
              <span className="ml-1 rounded-full bg-white/30 px-2 text-xs font-extrabold">
                {transfers.length}
              </span>
            </TabButton>
            <TabButton
              id="tab-medicos"
              active={tab === "medicos"}
              onClick={() => setTab("medicos")}
              icon={Stethoscope}
            >
              Médicos{" "}
              <span className="ml-1 rounded-full bg-white/30 px-2 text-xs font-extrabold">
                {doctors.length}
              </span>
            </TabButton>
          </div>
        </header>

        {tab === "filas" ? (
          <QueuePanel
            token={session.token}
            clinicId={session.user.clinicId}
            clinicName={clinicName}
          />
        ) : tab === "transferencias" ? (
          <TransfersPanel
            clinicId={session.user.clinicId}
            clinicName={clinicName}
            transfers={transfers}
            loading={transfersQuery.isLoading}
          />
        ) : (
          <DoctorsPanel token={session.token} doctors={doctors} loading={clinicQuery.isLoading} />
        )}
      </main>
    </div>
  );
}

function TabButton({
  id,
  active,
  onClick,
  icon: Icon,
  children,
}: {
  id: string;
  active: boolean;
  onClick: () => void;
  icon: typeof Users;
  children: React.ReactNode;
}) {
  return (
    <button
      id={id}
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold transition-all ${
        active
          ? "aero-btn text-white"
          : "text-sky-950/75 hover:bg-white/60 hover:text-sky-950"
      }`}
    >
      <Icon className="relative z-10 h-4 w-4" />
      <span className="relative z-10 flex items-center">{children}</span>
    </button>
  );
}

// ======================= FILAS =======================
function minutesSince(ts: number) {
  return Math.max(0, Math.round((Date.now() - ts) / 60000));
}

function QueuePanel({
  token,
  clinicId,
  clinicName,
}: {
  token: string;
  clinicId: string;
  clinicName: string;
}) {
  const qc = useQueryClient();
  const patients = usePatients(clinicId);
  const queue = sortedQueue(patients);
  const inService = patients.filter((p) => p.status === "in_service");
  const done = patients.filter((p) => p.status === "done");
  const transferred = patients.filter((p) => p.status === "transferred");
  const [busy, setBusy] = useState(false);
  const [transferTarget, setTransferTarget] = useState<Patient | null>(null);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
      await qc.invalidateQueries({ queryKey: ["patients"] });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat icon={Users} label="Aguardando" value={queue.length} orb="aero-orb" />
        <MiniStat icon={Activity} label="Em atendimento" value={inService.length} orb="aero-orb-amber" />
        <MiniStat icon={CheckCircle2} label="Atendidos" value={done.length} orb="aero-orb-green" />
        <MiniStat
          icon={ArrowLeftRight}
          label="Transferidos (externo)"
          value={transferred.length}
          orb="aero-orb"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="aero-glass rounded-3xl p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-sky-900/75">
              Fila de espera — {clinicName}
            </h2>
            <button
              id="queue-call-next"
              disabled={busy || queue.length === 0}
              onClick={() => run(() => callNext(patients))}
              className="aero-btn inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-extrabold"
            >
              <Megaphone className="relative z-10 h-4 w-4" />
              <span className="relative z-10">Chamar próximo</span>
            </button>
          </div>
          {queue.length === 0 ? (
            <EmptyState text="Nenhum paciente aguardando nesta unidade." />
          ) : (
            <ol className="max-h-[28rem] space-y-2.5 overflow-y-auto pr-1">
              {queue.map((p, i) => {
                const incoming = p.transfers.find(
                  (t) => t.destinationUsesSystem && t.toClinicId === clinicId && t.fromClinic,
                );
                return (
                  <li
                    key={p.id}
                    className="aero-glass-card group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm"
                  >
                    <span className="aero-orb flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black">
                      <span className="relative z-10">{i + 1}º</span>
                    </span>
                    <span className="font-black text-sky-700">{p.ticket}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate font-extrabold text-sky-950">{p.name}</span>
                        {p.lgpdConsent && p.truthfulnessConsent && (
                          <span
                            title="Termos LGPD, Veracidade e Uso Exclusivo confirmados"
                            className="text-emerald-600"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 text-sky-600" /> {minutesSince(p.arrivedAt)} min ·{" "}
                        {p.age} anos
                        {incoming?.fromClinic && (
                          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                            De: {incoming.fromClinic.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <PriorityBadge priority={p.priority} size="sm" />
                    <button
                      title="Transferir para outro hospital"
                      onClick={() => setTransferTarget(p)}
                      className="aero-btn-glass rounded-full p-2 text-sky-800"
                    >
                      <ArrowLeftRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      title="Remover da fila"
                      onClick={() => {
                        if (confirm(`Remover ${p.name} da fila?`)) run(() => removePatient(p.id));
                      }}
                      className="rounded-full border border-rose-200 bg-white/80 p-2 text-rose-600 opacity-70 transition-all hover:bg-rose-500 hover:text-white hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="aero-glass rounded-3xl p-6">
          <h2 className="mb-4 text-xs font-extrabold uppercase tracking-widest text-sky-900/75">
            Em atendimento
          </h2>
          {inService.length === 0 ? (
            <EmptyState text="Ninguém em atendimento agora." />
          ) : (
            <ul className="space-y-2.5">
              {inService.map((p) => (
                <li
                  key={p.id}
                  className="aero-tile-active flex flex-wrap items-center gap-2 rounded-2xl px-3.5 py-3 text-sm"
                >
                  <span className="font-black text-sky-700">{p.ticket}</span>
                  <span className="flex-1 truncate font-extrabold text-sky-950">{p.name}</span>
                  <button
                    disabled={busy}
                    onClick={() => setTransferTarget(p)}
                    title="Transferir paciente para outro hospital"
                    className="aero-btn-glass inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold"
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5" /> Transferir
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => run(() => finishPatient(p.id))}
                    className="aero-btn-green inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-extrabold"
                  >
                    <CheckCircle2 className="relative z-10 h-3.5 w-3.5" />
                    <span className="relative z-10">Finalizar</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <TransferPatientModal
        patient={transferTarget}
        token={token}
        currentClinicId={clinicId}
        currentClinicName={clinicName}
        onClose={() => setTransferTarget(null)}
      />
    </div>
  );
}

// ======================= TRANSFERÊNCIAS =======================
interface TransferListItem {
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
  fromClinic: { id: string; name: string; address: string | null; phone: string | null } | null;
  toClinic: { id: string; name: string; address: string | null; phone: string | null } | null;
  patient: {
    id: string;
    ticket: string;
    name: string;
    age: number;
    document: string;
    symptoms: string;
    painLevel: number;
    hasFever: boolean;
    hasBreathingIssue: boolean;
    hasChestPain: boolean;
    priority: string;
    status: string;
  };
}

function buildReportFromTransfer(
  t: TransferListItem,
  fallbackOrigin: string,
): TransferReportInput {
  return {
    protocol: t.protocol,
    createdAt: t.createdAt,
    patientName: t.patient.name,
    patientAge: t.patient.age,
    patientDocument: t.patient.document,
    patientTicket: t.patient.ticket,
    priorityLabel: priorityLabel[(t.patient.priority as Priority) ?? "low"] ?? t.patient.priority,
    symptoms: t.patient.symptoms,
    painLevel: t.patient.painLevel,
    hasFever: t.patient.hasFever,
    hasBreathingIssue: t.patient.hasBreathingIssue,
    hasChestPain: t.patient.hasChestPain,
    fromClinicName: t.fromClinic?.name ?? fallbackOrigin,
    destinationUsesSystem: t.destinationUsesSystem,
    destinationName: t.destinationUsesSystem
      ? t.toClinic?.name ?? "Hospital parceiro"
      : t.externalHospitalName ?? "Hospital externo",
    destinationAddress: t.destinationUsesSystem
      ? t.toClinic?.address
      : t.externalHospitalAddress,
    destinationPhone: t.destinationUsesSystem ? t.toClinic?.phone : t.externalHospitalPhone,
    reason: t.reason,
    clinicalNotes: t.clinicalNotes,
    transferredBy: t.transferredBy,
  };
}

function TransfersPanel({
  clinicId,
  clinicName,
  transfers,
  loading,
}: {
  clinicId: string;
  clinicName: string;
  transfers: TransferListItem[];
  loading: boolean;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyReport(t: TransferListItem) {
    const text = formatTransferReportText(buildReportFromTransfer(t, clinicName));
    await navigator.clipboard.writeText(text);
    setCopiedId(t.id);
    setTimeout(() => setCopiedId((prev) => (prev === t.id ? null : prev)), 2500);
  }

  return (
    <div className="aero-glass rounded-3xl p-6">
      <div className="mb-5">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-sky-900/75">
          Histórico de Transferências Inter-Hospitalares
        </h2>
        <p className="mt-1 text-xs font-medium text-muted-foreground">
          Transferências enviadas (para hospitais integrados ao Sem Espera ou hospitais externos) e
          transferências recebidas de outras unidades.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
        </div>
      ) : transfers.length === 0 ? (
        <EmptyState text="Nenhuma transferência registrada ainda. Utilize o botão Transferir na aba Filas para encaminhar um paciente." />
      ) : (
        <ul className="space-y-3">
          {transfers.map((t) => {
            const isIncoming = t.toClinicId === clinicId;
            const destinationName = t.destinationUsesSystem
              ? t.toClinic?.name ?? "Hospital parceiro"
              : t.externalHospitalName ?? "Hospital externo";

            return (
              <li key={t.id} className="aero-glass-card rounded-2xl p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-sky-700">
                        {t.protocol}
                      </span>
                      <span
                        className={`aero-pill inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold text-white ${
                          isIncoming
                            ? "border-emerald-700/80 bg-[linear-gradient(180deg,#9cf974_0%,#25c956_50%,#0da140_100%)]"
                            : "border-sky-700/80 bg-[linear-gradient(180deg,#64e2ff_0%,#0ea9f5_50%,#007dd8_100%)]"
                        }`}
                      >
                        {isIncoming ? (
                          <>
                            <ArrowDownLeft className="relative z-10 h-3 w-3" />
                            <span className="relative z-10">Recebida</span>
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="relative z-10 h-3 w-3" />
                            <span className="relative z-10">Enviada</span>
                          </>
                        )}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                          t.destinationUsesSystem
                            ? "border-sky-300 bg-white/80 text-sky-900"
                            : "border-amber-400 bg-amber-100/85 text-amber-900"
                        }`}
                      >
                        {t.destinationUsesSystem
                          ? "Destino usa Sem Espera"
                          : "Destino externo (fora do sistema)"}
                      </span>
                      <PriorityBadge priority={t.patient.priority as Priority} size="sm" />
                    </div>

                    <div className="font-extrabold text-sky-950">
                      {t.patient.ticket} — {t.patient.name}{" "}
                      <span className="text-xs font-semibold text-muted-foreground">
                        ({t.patient.age} anos)
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <strong className="text-sky-950">Origem:</strong>{" "}
                      {t.fromClinic?.name ?? "Não informada"} →{" "}
                      <strong className="text-sky-950">Destino:</strong> {destinationName}
                      {!t.destinationUsesSystem && t.externalHospitalAddress
                        ? ` (${t.externalHospitalAddress})`
                        : ""}
                    </div>

                    <div className="text-xs text-sky-950/90">
                      <strong>Motivo:</strong> {t.reason}
                    </div>
                    {t.clinicalNotes && (
                      <div className="text-xs text-muted-foreground">
                        <strong>Obs. clínicas:</strong> {t.clinicalNotes}
                      </div>
                    )}
                    <div className="text-[11px] font-semibold text-muted-foreground">
                      {new Date(t.createdAt).toLocaleString("pt-BR")}
                      {t.transferredBy ? ` · Responsável: ${t.transferredBy}` : ""}
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => printTransferReport(buildReportFromTransfer(t, clinicName))}
                      className="aero-btn-glass inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold"
                    >
                      <Printer className="h-3.5 w-3.5 text-sky-600" /> Guia
                    </button>
                    <button
                      type="button"
                      onClick={() => copyReport(t)}
                      className="aero-btn-glass inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold"
                    >
                      {copiedId === t.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-sky-600" /> Copiar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ======================= MÉDICOS =======================
interface Doctor {
  id: string;
  name: string;
  email: string;
  specialty: string | null;
  crm: string | null;
  active: boolean;
}

function DoctorsPanel({
  token,
  doctors,
  loading,
}: {
  token: string;
  doctors: Doctor[];
  loading: boolean;
}) {
  const qc = useQueryClient();
  const empty = { name: "", email: "", password: "", specialty: "", crm: "" };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["clinic"] });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      await createDoctorFn({ data: { token, ...form } });
      setForm(empty);
      setMsg({
        type: "ok",
        text: "Médico cadastrado! Ele já pode entrar com este e-mail e senha.",
      });
      await refresh();
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Erro ao cadastrar." });
    } finally {
      setSaving(false);
    }
  }

  async function action(fn: () => Promise<unknown>) {
    try {
      await fn();
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao executar ação.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
      <form onSubmit={handleAdd} className="aero-glass h-fit space-y-4 rounded-3xl p-6">
        <div className="flex items-center gap-2.5">
          <div className="aero-orb flex h-9 w-9 items-center justify-center rounded-xl">
            <UserPlus className="relative z-10 h-4 w-4 text-white" />
          </div>
          <h2 className="font-extrabold text-sky-950">Adicionar médico</h2>
        </div>
        <input
          id="doctor-name"
          className="aero-input"
          placeholder="Nome completo *"
          value={form.name}
          onChange={set("name")}
          required
        />
        <input
          id="doctor-email"
          type="email"
          className="aero-input"
          placeholder="E-mail de acesso *"
          value={form.email}
          onChange={set("email")}
          required
        />
        <input
          id="doctor-password"
          type="password"
          className="aero-input"
          placeholder="Senha (mín. 6) *"
          minLength={6}
          value={form.password}
          onChange={set("password")}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            id="doctor-specialty"
            className="aero-input"
            placeholder="Especialidade"
            value={form.specialty}
            onChange={set("specialty")}
          />
          <input
            id="doctor-crm"
            className="aero-input"
            placeholder="CRM"
            value={form.crm}
            onChange={set("crm")}
          />
        </div>
        {msg && (
          <p
            className={`rounded-2xl border px-4 py-2.5 text-sm font-bold ${
              msg.type === "ok"
                ? "border-emerald-300 bg-emerald-100/90 text-emerald-800"
                : "border-rose-300 bg-rose-100/90 text-rose-700"
            }`}
          >
            {msg.text}
          </p>
        )}
        <button
          id="doctor-add-submit"
          type="submit"
          disabled={saving}
          className="aero-btn flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-extrabold"
        >
          {saving ? (
            <Loader2 className="relative z-10 h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="relative z-10 h-4 w-4" />
          )}
          <span className="relative z-10">Cadastrar médico</span>
        </button>
      </form>

      <div className="aero-glass rounded-3xl p-6">
        <h2 className="mb-4 text-xs font-extrabold uppercase tracking-widest text-sky-900/75">
          Equipe médica
        </h2>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
          </div>
        ) : doctors.length === 0 ? (
          <EmptyState text="Nenhum médico cadastrado ainda." />
        ) : (
          <ul className="space-y-2.5">
            {doctors.map((d) => (
              <li
                key={d.id}
                className={`aero-glass-card flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3 transition-opacity ${
                  d.active ? "" : "opacity-65"
                }`}
              >
                <div className="aero-orb flex h-10 w-10 items-center justify-center rounded-full font-black">
                  <span className="relative z-10">{d.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-extrabold text-sky-950">{d.name}</span>
                    <span
                      className={`aero-pill rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                        d.active
                          ? "border-emerald-700/80 bg-[linear-gradient(180deg,#9cf974_0%,#25c956_50%,#0da140_100%)] text-white"
                          : "border-slate-300 bg-white/80 text-slate-600"
                      }`}
                    >
                      <span className="relative z-10">{d.active ? "Ativo" : "Inativo"}</span>
                    </span>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {d.email}
                    {d.specialty && ` · ${d.specialty}`}
                    {d.crm && ` · CRM ${d.crm}`}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <IconBtn
                    title="Redefinir senha"
                    onClick={() => {
                      const pwd = prompt(`Nova senha para ${d.name} (mín. 6 caracteres):`);
                      if (pwd)
                        action(() =>
                          resetDoctorPasswordFn({ data: { token, doctorId: d.id, password: pwd } }),
                        );
                    }}
                    icon={KeyRound}
                  />
                  <IconBtn
                    title={d.active ? "Desativar acesso" : "Reativar acesso"}
                    onClick={() => action(() => toggleDoctorFn({ data: { token, doctorId: d.id } }))}
                    icon={Power}
                  />
                  <IconBtn
                    title="Remover médico"
                    danger
                    onClick={() => {
                      if (confirm(`Remover ${d.name} da clínica? O acesso será excluído.`))
                        action(() => removeDoctorFn({ data: { token, doctorId: d.id } }));
                    }}
                    icon={Trash2}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function IconBtn({
  title,
  onClick,
  icon: Icon,
  danger,
}: {
  title: string;
  onClick: () => void;
  icon: typeof Users;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      className={
        danger
          ? "rounded-full border border-rose-200 bg-white/80 p-2 text-rose-600 transition-colors hover:bg-rose-500 hover:text-white"
          : "aero-btn-glass rounded-full p-2 text-sky-800"
      }
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  orb,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  orb: "aero-orb" | "aero-orb-green" | "aero-orb-amber";
}) {
  return (
    <div className="aero-glass flex items-center gap-4 rounded-3xl p-5">
      <div className={`${orb} flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl`}>
        <Icon className="relative z-10 h-5 w-5 text-white" />
      </div>
      <div>
        <div className="aero-title-gradient text-3xl font-black tracking-tight">{value}</div>
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-sky-900/70">
          {label}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm font-semibold text-sky-900/70">{text}</p>;
}
