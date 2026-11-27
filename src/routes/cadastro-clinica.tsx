import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppNav } from "@/components/AppNav";
import { login } from "@/lib/auth-store";
import { registerClinicFn } from "@/lib/api/clinic.functions";
import { PLAN_LIST, PLANS, isPlanId, type PlanId } from "@/lib/plans";
import {
  Building2,
  Check,
  CreditCard,
  Crown,
  Info,
  Loader2,
  Lock,
  ShieldCheck,
  Star,
} from "lucide-react";

export const Route = createFileRoute("/cadastro-clinica")({
  validateSearch: (search: Record<string, unknown>): { plan?: PlanId } => ({
    plan: isPlanId(search.plan) ? search.plan : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Cadastro de Clínica — Sem Espera" },
      {
        name: "description",
        content:
          "Escolha um plano, cadastre sua clínica e gerencie médicos e filas em tempo real.",
      },
    ],
  }),
  component: CadastroClinicaPage,
});

const onlyDigits = (v: string) => v.replace(/\D/g, "");
const formatCard = (v: string) => onlyDigits(v).slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
const formatExpiry = (v: string) => {
  const d = onlyDigits(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};
const formatCnpj = (v: string) => {
  const d = onlyDigits(v).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
};
const formatPhone = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

function CadastroClinicaPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [plan, setPlan] = useState<PlanId | null>(search.plan ?? null);
  const [form, setForm] = useState({
    clinicName: "",
    cnpj: "",
    phone: "",
    address: "",
    adminName: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [card, setCard] = useState({ holder: "", number: "", expiry: "", cvv: "" });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [exclusiveUseAccepted, setExclusiveUseAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"idle" | "paying" | "creating">("idle");
  const loading = step !== "idle";

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function validateCard(): string | null {
    if (card.holder.trim().length < 3) return "Informe o nome impresso no cartão.";
    if (onlyDigits(card.number).length !== 16) return "O número do cartão deve ter 16 dígitos.";
    const [mm, yy] = card.expiry.split("/");
    const month = Number(mm);
    if (!yy || yy.length !== 2 || month < 1 || month > 12) return "Validade inválida (use MM/AA).";
    if (!/^\d{3,4}$/.test(card.cvv)) return "CVV inválido.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!plan) return setError("Escolha um plano para cadastrar a clínica.");
    if (form.password.length < 6) return setError("A senha deve ter pelo menos 6 caracteres.");
    if (form.password !== form.confirm) return setError("As senhas não conferem.");
    if (form.cnpj) {
      const cnpjDigits = onlyDigits(form.cnpj);
      if (cnpjDigits.length > 0 && cnpjDigits.length !== 14) {
        return setError("CNPJ inválido ou incompleto (deve conter 14 dígitos).");
      }
    }
    if (form.phone) {
      const phoneDigits = onlyDigits(form.phone);
      if (phoneDigits.length > 0 && (phoneDigits.length < 10 || phoneDigits.length > 11)) {
        return setError("Telefone inválido ou incompleto (deve conter DDD + 8 ou 9 dígitos).");
      }
    }
    const cardError = validateCard();
    if (cardError) return setError(cardError);
    if (!exclusiveUseAccepted) {
      return setError(
        "É obrigatório confirmar o Termo de Uso Exclusivo do sistema Sem Espera na sua unidade.",
      );
    }
    if (!termsAccepted) {
      return setError(
        "É obrigatório aceitar os Termos de Uso e a Política de Proteção de Dados (LGPD).",
      );
    }

    try {
      setStep("paying");
      await new Promise((r) => setTimeout(r, 1400));
      setStep("creating");
      const { confirm: _confirm, ...data } = form;
      const result = await registerClinicFn({
        data: { ...data, plan, termsAccepted: true, exclusiveUseAccepted: true },
      });
      login({
        token: result.token,
        user: { ...result.user, role: "admin", clinicId: result.user.clinicId! },
      });
      navigate({ to: "/clinica" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível cadastrar a clínica.");
    } finally {
      setStep("idle");
    }
  }

  const selected = plan ? PLANS[plan] : null;

  return (
    <div className="aero-page pb-16">
      <AppNav />
      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[1fr_1.3fr]">
        {/* ---------- Resumo do pedido ---------- */}
        <section className="lg:sticky lg:top-24 lg:h-fit">
          <div className="aero-pill inline-flex items-center gap-2 rounded-full border border-sky-300/80 bg-white/85 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-sky-800">
            <Building2 className="relative z-10 h-3.5 w-3.5 text-sky-600" />
            <span className="relative z-10">Para clínicas e hospitais</span>
          </div>
          <h1 className="aero-title-gradient mt-4 text-4xl font-black tracking-tight">
            Cadastre sua clínica
          </h1>
          <p className="mt-3 font-semibold text-sky-950/80">
            Para criar a conta é necessário assinar um plano. Escolha o que melhor atende sua
            unidade e comece a usar na hora.
          </p>

          <div className="aero-glass mt-8 rounded-3xl p-6">
            <p className="text-xs font-extrabold uppercase tracking-widest text-sky-900/70">
              Resumo do pedido
            </p>
            {selected ? (
              <>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-2xl font-black text-sky-950">
                    {selected.id !== "normal" && <Crown className="h-5 w-5 text-sky-600" />}
                    Plano {selected.name}
                  </h2>
                  <div className="text-right">
                    <span className="aero-title-gradient text-2xl font-black tracking-tight">
                      R$ {selected.price}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground"> / mês</span>
                  </div>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{selected.description}</p>
                <ul className="mt-5 space-y-2.5">
                  {selected.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2.5 text-sm font-medium text-sky-950/90">
                      <span className="aero-orb-green mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full">
                        <Check className="relative z-10 h-2.5 w-2.5 text-white" />
                      </span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex items-center justify-between border-t border-white/80 pt-4 text-sm">
                  <span className="font-extrabold text-sky-950">Total hoje</span>
                  <span className="text-lg font-black text-sky-800">R$ {selected.price}</span>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm font-semibold text-muted-foreground">
                Nenhum plano selecionado. Escolha um plano ao lado para continuar.
              </p>
            )}
          </div>

          <div className="aero-glass-card mt-4 flex items-start gap-2.5 rounded-2xl p-3.5 text-xs text-sky-900/80">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
            <span>
              Ambiente de demonstração: o pagamento é simulado e nenhum valor é cobrado. Use
              qualquer número de cartão com 16 dígitos.
            </span>
          </div>
        </section>

        {/* ---------- Formulário ---------- */}
        <form onSubmit={handleSubmit} className="aero-glass space-y-6 rounded-3xl p-6 sm:p-8">
          <fieldset className="space-y-3">
            <legend className="mb-2 text-xs font-extrabold uppercase tracking-widest text-sky-900/75">
              1. Escolha o plano *
            </legend>
            <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Plano">
              {PLAN_LIST.map((p) => {
                const active = plan === p.id;
                return (
                  <button
                    key={p.id}
                    id={`plan-option-${p.id}`}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setPlan(p.id)}
                    className={`relative rounded-2xl p-4 text-left hover:-translate-y-0.5 ${
                      active ? "aero-tile-active" : "aero-tile"
                    }`}
                  >
                    {p.popular && (
                      <span className="aero-pill absolute -top-2.5 right-3 flex items-center gap-1 rounded-full border border-sky-700/80 bg-[linear-gradient(180deg,#64e2ff_0%,#0ea9f5_48%,#007dd8_52%,#22bdf5_100%)] px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-white">
                        <Star className="relative z-10 h-2.5 w-2.5 fill-current" />
                        <span className="relative z-10">Popular</span>
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sky-950">{p.name}</span>
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                          active
                            ? "aero-orb border-white text-white"
                            : "border-sky-300 bg-white/80"
                        }`}
                      >
                        {active && <Check className="relative z-10 h-3 w-3" />}
                      </span>
                    </div>
                    <div className="mt-2 text-lg font-black tracking-tight text-sky-900">
                      R$ {p.price}
                    </div>
                    <div className="text-xs font-semibold text-muted-foreground">
                      {p.maxDoctors === null ? "Médicos ilimitados" : `Até ${p.maxDoctors} médicos`}
                    </div>
                  </button>
                );
              })}
            </div>
            <Link
              to="/planos"
              className="inline-block text-xs font-extrabold text-sky-700 hover:underline"
            >
              Comparar planos em detalhes
            </Link>
          </fieldset>

          <hr className="border-white/75" />

          <fieldset className="space-y-4">
            <legend className="mb-2 text-xs font-extrabold uppercase tracking-widest text-sky-900/75">
              2. Dados da clínica
            </legend>
            <Field id="clinic-name" label="Nome da clínica *">
              <input
                id="clinic-name"
                className="aero-input"
                value={form.clinicName}
                onChange={set("clinicName")}
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="clinic-cnpj" label="CNPJ">
                <input
                  id="clinic-cnpj"
                  inputMode="numeric"
                  maxLength={18}
                  className="aero-input"
                  value={form.cnpj}
                  onChange={(e) => setForm((f) => ({ ...f, cnpj: formatCnpj(e.target.value) }))}
                  placeholder="00.000.000/0000-00"
                />
              </Field>
              <Field id="clinic-phone" label="Telefone">
                <input
                  id="clinic-phone"
                  inputMode="numeric"
                  maxLength={15}
                  className="aero-input"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: formatPhone(e.target.value) }))}
                  placeholder="(11) 99999-9999"
                />
              </Field>
            </div>
            <Field id="clinic-address" label="Endereço">
              <input
                id="clinic-address"
                className="aero-input"
                value={form.address}
                onChange={set("address")}
              />
            </Field>
          </fieldset>

          <hr className="border-white/75" />

          <fieldset className="space-y-4">
            <legend className="mb-2 text-xs font-extrabold uppercase tracking-widest text-sky-900/75">
              3. Conta do gestor
            </legend>
            <Field id="admin-name" label="Seu nome *">
              <input
                id="admin-name"
                className="aero-input"
                value={form.adminName}
                onChange={set("adminName")}
                required
              />
            </Field>
            <Field id="admin-email" label="E-mail corporativo *">
              <input
                id="admin-email"
                type="email"
                className="aero-input"
                value={form.email}
                onChange={set("email")}
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="admin-password" label="Senha *">
                <input
                  id="admin-password"
                  type="password"
                  className="aero-input"
                  value={form.password}
                  onChange={set("password")}
                  required
                />
              </Field>
              <Field id="admin-confirm" label="Confirmar senha *">
                <input
                  id="admin-confirm"
                  type="password"
                  className="aero-input"
                  value={form.confirm}
                  onChange={set("confirm")}
                  required
                />
              </Field>
            </div>
          </fieldset>

          <hr className="border-white/75" />

          <fieldset className="space-y-4">
            <legend className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-sky-900/75">
              4. Pagamento
              <span className="aero-pill rounded-full border border-amber-500/80 bg-[linear-gradient(180deg,#fff08a_0%,#ffc226_50%,#eb8b00_100%)] px-2.5 py-0.5 text-[10px] font-extrabold text-amber-950">
                <span className="relative z-10">Simulado</span>
              </span>
            </legend>
            <Field id="card-holder" label="Nome no cartão *">
              <input
                id="card-holder"
                className="aero-input"
                value={card.holder}
                onChange={(e) => setCard((c) => ({ ...c, holder: e.target.value }))}
                required
              />
            </Field>
            <Field id="card-number" label="Número do cartão *">
              <div className="relative">
                <CreditCard className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-600" />
                <input
                  id="card-number"
                  inputMode="numeric"
                  className="aero-input pl-11 tracking-wider"
                  placeholder="0000 0000 0000 0000"
                  value={card.number}
                  onChange={(e) => setCard((c) => ({ ...c, number: formatCard(e.target.value) }))}
                  required
                />
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field id="card-expiry" label="Validade *">
                <input
                  id="card-expiry"
                  inputMode="numeric"
                  className="aero-input"
                  placeholder="MM/AA"
                  value={card.expiry}
                  onChange={(e) => setCard((c) => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                  required
                />
              </Field>
              <Field id="card-cvv" label="CVV *">
                <input
                  id="card-cvv"
                  inputMode="numeric"
                  className="aero-input"
                  placeholder="123"
                  value={card.cvv}
                  onChange={(e) =>
                    setCard((c) => ({ ...c, cvv: onlyDigits(e.target.value).slice(0, 4) }))
                  }
                  required
                />
              </Field>
            </div>
          </fieldset>

          <hr className="border-white/75" />

          <fieldset className="space-y-3">
            <legend className="mb-2 flex items-center justify-between text-xs font-extrabold uppercase tracking-widest text-sky-900/75">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                5. Termos Legais, LGPD e Uso Exclusivo *
              </span>
              <a
                href="/termos"
                target="_blank"
                rel="noreferrer"
                className="font-extrabold normal-case tracking-normal text-sky-700 hover:underline"
              >
                Ler termos completos
              </a>
            </legend>

            <label
              htmlFor="clinic-exclusive-use"
              className={`flex cursor-pointer items-start gap-3 rounded-2xl p-4 ${
                exclusiveUseAccepted ? "aero-tile-active" : "aero-tile"
              }`}
            >
              <input
                id="clinic-exclusive-use"
                type="checkbox"
                checked={exclusiveUseAccepted}
                onChange={(e) => setExclusiveUseAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-sky-600"
              />
              <span className="text-xs leading-relaxed">
                <strong className="block text-sm font-extrabold text-sky-950">
                  Termo de Uso Exclusivo e Obrigatório do Sistema Sem Espera *
                </strong>
                <span className="mt-0.5 block text-muted-foreground">
                  Declaro e confirmo que esta clínica/hospital adotará exclusivamente o sistema Sem
                  Espera para pré-triagem digital e gerenciamento de fila única na unidade,
                  cumprindo integralmente esta regra e não operando sistemas paralelos conflitantes.
                </span>
              </span>
            </label>

            <label
              htmlFor="clinic-terms-lgpd"
              className={`flex cursor-pointer items-start gap-3 rounded-2xl p-4 ${
                termsAccepted ? "aero-tile-active" : "aero-tile"
              }`}
            >
              <input
                id="clinic-terms-lgpd"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-sky-600"
              />
              <span className="text-xs leading-relaxed">
                <strong className="block text-sm font-extrabold text-sky-950">
                  Termos de Uso, Proteção de Dados (LGPD) e Transferências *
                </strong>
                <span className="mt-0.5 block text-muted-foreground">
                  Li e aceito os Termos de Uso e a Política de Proteção de Dados (LGPD — Lei nº
                  13.709/2018), comprometendo-me ao sigilo dos dados sensíveis de saúde dos
                  pacientes e ao cumprimento do protocolo de transferência inter-hospitalar.
                </span>
              </span>
            </label>
          </fieldset>

          {error && (
            <p className="rounded-2xl border border-rose-300 bg-rose-100/90 px-4 py-2.5 text-sm font-bold text-rose-700">
              {error}
            </p>
          )}

          <button
            id="clinic-register-submit"
            type="submit"
            disabled={loading || !plan || !termsAccepted || !exclusiveUseAccepted}
            className="aero-btn flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-extrabold"
          >
            {loading ? (
              <Loader2 className="relative z-10 h-4 w-4 animate-spin" />
            ) : (
              <Lock className="relative z-10 h-4 w-4" />
            )}
            <span className="relative z-10">
              {step === "paying"
                ? "Processando pagamento..."
                : step === "creating"
                  ? "Criando sua clínica..."
                  : selected
                    ? `Assinar ${selected.name} e cadastrar — R$ ${selected.price}/mês`
                    : "Escolha um plano para continuar"}
            </span>
          </button>

          <p className="text-center text-sm font-semibold text-sky-950/75">
            Já tem conta?{" "}
            <Link to="/login" className="font-extrabold text-sky-700 hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-extrabold text-sky-950">
        {label}
      </label>
      {children}
    </div>
  );
}
