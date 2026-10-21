import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppNav } from "@/components/AppNav";
import { PriorityBadge } from "@/components/PriorityBadge";
import { logout, useSession } from "@/lib/auth-store";
import {
  callNext,
  finishPatient,
  removePatient,
  sortedQueue,
  usePatients,
} from "@/lib/triage-store";
import {
  createDoctorFn,
  getClinicFn,
  removeDoctorFn,
  resetDoctorPasswordFn,
  toggleDoctorFn,
} from "@/lib/api/clinic.functions";
import {
  Activity,
  Building2,
  CheckCircle2,
  Clock,
  KeyRound,
  ListOrdered,
  Loader2,
  Megaphone,
  Power,
  Stethoscope,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/clinica")({
  head: () => ({
    meta: [
      { title: "Gerenciamento da Clínica — Sem Espera" },
      { name: "description", content: "Painel do gestor: filas em tempo real e gestão de médicos." },
    ],
  }),
  component: ClinicaPage,
});

type Tab = "filas" | "medicos";

function ClinicaPage() {
  const navigate = useNavigate();
  const session = useSession();
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<Tab>("filas");

  useEffect(() => setHydrated(true), []);

  // Somente o gestor da clínica pode acessar esta tela
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

  // Token inválido/expirado → força novo login
  useEffect(() => {
    if (clinicQuery.error) {
      logout();
      navigate({ to: "/login", replace: true });
    }
  }, [clinicQuery.error, navigate]);

  if (!hydrated || !session || session.user.role !== "admin") return null;

  const clinic = clinicQuery.data?.clinic;
  const doctors = (clinicQuery.data?.staff ?? []).filter((u) => u.role === "doctor");

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Gerenciamento da clínica
              </p>
              <h1 className="text-2xl font-black tracking-tight">
                {clinic?.name ?? session.user.clinicName}
              </h1>
              <p className="text-sm text-muted-foreground">Gestor: {session.user.name}</p>
            </div>
          </div>

          <div className="flex rounded-xl border border-border bg-muted/50 p-1" role="tablist">
            <TabButton id="tab-filas" active={tab === "filas"} onClick={() => setTab("filas")} icon={ListOrdered}>
              Filas
            </TabButton>
            <TabButton id="tab-medicos" active={tab === "medicos"} onClick={() => setTab("medicos")} icon={Stethoscope}>
              Médicos <span className="ml-1 rounded-full bg-primary/15 px-2 text-xs text-primary">{doctors.length}</span>
            </TabButton>
          </div>
        </header>

        {tab === "filas" ? (
          <QueuePanel />
        ) : (
          <DoctorsPanel token={session.token} doctors={doctors} loading={clinicQuery.isLoading} />
        )}
      </main>
    </div>
  );
}

function TabButton({
  id, active, onClick, icon: Icon, children,
}: {
  id: string; active: boolean; onClick: () => void; icon: typeof Users; children: React.ReactNode;
}) {
  return (
    <button
      id={id}
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${
        active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

// ======================= FILAS =======================
function minutesSince(ts: number) {
  return Math.max(0, Math.round((Date.now() - ts) / 60000));
}

function QueuePanel() {
  const qc = useQueryClient();
  const patients = usePatients();
  const queue = sortedQueue(patients);
  const inService = patients.filter((p) => p.status === "in_service");
  const done = patients.filter((p) => p.status === "done");
  const [busy, setBusy] = useState(false);

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
    <div className="space-y-6 animate-in fade-in duration-500">
      <section className="grid gap-4 sm:grid-cols-3">
        <MiniStat icon={Users} label="Aguardando" value={queue.length} cls="bg-primary/10 text-primary" />
        <MiniStat icon={Activity} label="Em atendimento" value={inService.length} cls="bg-priority-medium/20 text-priority-medium" />
        <MiniStat icon={CheckCircle2} label="Atendidos" value={done.length} cls="bg-priority-low/15 text-priority-low" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Fila de espera
            </h2>
            <button
              id="queue-call-next"
              disabled={busy || queue.length === 0}
              onClick={() => run(() => callNext(patients))}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            >
              <Megaphone className="h-4 w-4" /> Chamar próximo
            </button>
          </div>
          {queue.length === 0 ? (
            <EmptyState text="Nenhum paciente aguardando." />
          ) : (
            <ol className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
              {queue.map((p, i) => (
                <li
                  key={p.id}
                  className="group flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-sm transition-colors hover:bg-muted/50"
                >
                  <span className="w-6 text-center text-xs font-bold text-muted-foreground">{i + 1}º</span>
                  <span className="font-bold text-primary">{p.ticket}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{p.name}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {minutesSince(p.arrivedAt)} min · {p.age} anos
                    </div>
                  </div>
                  <PriorityBadge priority={p.priority} size="sm" />
                  <button
                    title="Remover da fila"
                    onClick={() => {
                      if (confirm(`Remover ${p.name} da fila?`)) run(() => removePatient(p.id));
                    }}
                    className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Em atendimento
          </h2>
          {inService.length === 0 ? (
            <EmptyState text="Ninguém em atendimento agora." />
          ) : (
            <ul className="space-y-2">
              {inService.map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-xl border border-priority-medium/40 bg-priority-medium/5 px-3 py-2.5 text-sm">
                  <span className="font-bold text-primary">{p.ticket}</span>
                  <span className="flex-1 truncate font-medium">{p.name}</span>
                  <button
                    disabled={busy}
                    onClick={() => run(() => finishPatient(p.id))}
                    className="inline-flex items-center gap-1 rounded-lg bg-priority-low/15 px-2.5 py-1 text-xs font-bold text-priority-low transition-all hover:bg-priority-low/25 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Finalizar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
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

function DoctorsPanel({ token, doctors, loading }: { token: string; doctors: Doctor[]; loading: boolean }) {
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
      setMsg({ type: "ok", text: "Médico cadastrado! Ele já pode entrar com este e-mail e senha." });
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

  const inputCls =
    "w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div className="grid gap-6 animate-in fade-in duration-500 lg:grid-cols-[1fr_1.5fr]">
      <form
        onSubmit={handleAdd}
        className="h-fit space-y-4 rounded-2xl border border-border bg-card p-6"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          <h2 className="font-bold">Adicionar médico</h2>
        </div>
        <input id="doctor-name" className={inputCls} placeholder="Nome completo *" value={form.name} onChange={set("name")} required />
        <input id="doctor-email" type="email" className={inputCls} placeholder="E-mail de acesso *" value={form.email} onChange={set("email")} required />
        <input id="doctor-password" type="password" className={inputCls} placeholder="Senha (mín. 6) *" minLength={6} value={form.password} onChange={set("password")} required />
        <div className="grid grid-cols-2 gap-3">
          <input id="doctor-specialty" className={inputCls} placeholder="Especialidade" value={form.specialty} onChange={set("specialty")} />
          <input id="doctor-crm" className={inputCls} placeholder="CRM" value={form.crm} onChange={set("crm")} />
        </div>
        {msg && (
          <p className={`rounded-xl px-4 py-2.5 text-sm font-medium ${msg.type === "ok" ? "bg-priority-low/10 text-priority-low" : "bg-destructive/10 text-destructive"}`}>
            {msg.text}
          </p>
        )}
        <button
          id="doctor-add-submit"
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Cadastrar médico
        </button>
      </form>

      <div className="rounded-2xl border border-border bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Equipe médica
        </h2>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : doctors.length === 0 ? (
          <EmptyState text="Nenhum médico cadastrado ainda." />
        ) : (
          <ul className="space-y-2">
            {doctors.map((d) => (
              <li
                key={d.id}
                className={`flex flex-wrap items-center gap-3 rounded-xl border border-border px-4 py-3 transition-opacity ${d.active ? "" : "opacity-60"}`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                  {d.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-bold">{d.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${d.active ? "bg-priority-low/15 text-priority-low" : "bg-muted text-muted-foreground"}`}>
                      {d.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {d.email}
                    {d.specialty && ` · ${d.specialty}`}
                    {d.crm && ` · CRM ${d.crm}`}
                  </div>
                </div>
                <div className="flex gap-1">
                  <IconBtn
                    title="Redefinir senha"
                    onClick={() => {
                      const pwd = prompt(`Nova senha para ${d.name} (mín. 6 caracteres):`);
                      if (pwd) action(() => resetDoctorPasswordFn({ data: { token, doctorId: d.id, password: pwd } }));
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
  title, onClick, icon: Icon, danger,
}: {
  title: string; onClick: () => void; icon: typeof Users; danger?: boolean;
}) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`rounded-lg p-2 text-muted-foreground transition-colors ${danger ? "hover:bg-destructive/10 hover:text-destructive" : "hover:bg-muted hover:text-foreground"}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function MiniStat({ icon: Icon, label, value, cls }: { icon: typeof Users; label: string; value: number; cls: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${cls}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{text}</p>;
}
