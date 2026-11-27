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
  const inputCls =
    "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[1fr_1.3fr]">
        {/* ---------- Resumo do pedido ---------- */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 lg:sticky lg:top-24 lg:h-fit">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            <Building2 className="h-3.5 w-3.5" /> Para clínicas
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight">
            Cadastre sua <span className="text-primary">clínica</span>
          </h1>
          <p className="mt-4 text-muted-foreground">
            Para criar a conta é necessário assinar um plano. Escolha o que melhor atende sua
            unidade e comece a usar na hora.
          </p>

          <div
            className={`mt-8 rounded-3xl border p-6 transition-all ${
              selected ? "border-primary/40 bg-primary/5" : "border-dashed border-border bg-card"
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Resumo do pedido
            </p>
            {selected ? (
              <>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-2xl font-black">
                    {selected.id !== "normal" && <Crown className="h-5 w-5 text-primary" />}
                    Plano {selected.name}
                  </h2>
                  <div className="text-right">
                    <span className="text-2xl font-black tracking-tight">R$ {selected.price}</span>
                    <span className="text-xs text-muted-foreground"> / mês</span>
                  </div>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{selected.description}</p>
                <ul className="mt-5 space-y-2.5">
                  {selected.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-sm">
                  <span className="font-bold">Total hoje</span>
                  <span className="font-black">R$ {selected.price}</span>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Nenhum plano selecionado. Escolha um plano ao lado para continuar.
              </p>
            )}
          </div>

          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Ambiente de demonstração: o pagamento é simulado e nenhum valor é cobrado. Use qualquer
            número de cartão com 16 dígitos.
          </p>
        </section>

        {/* ---------- Formulário ---------- */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8 animate-in fade-in slide-in-from-bottom-8 duration-700"
        >
          <fieldset className="space-y-3">
            <legend className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
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
                    className={`relative rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                      active
                        ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                        : "border-border bg-background hover:border-primary/40"
                    }`}
                  >
                    {p.popular && (
                      <span className="absolute -top-2.5 right-3 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
                        <Star className="h-2.5 w-2.5 fill-current" /> Popular
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{p.name}</span>
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                          active ? "border-primary bg-primary text-primary-foreground" : "border-border"
                        }`}
                      >
                        {active && <Check className="h-3 w-3" />}
                      </span>
                    </div>
                    <div className="mt-2 text-lg font-black tracking-tight">R$ {p.price}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.maxDoctors === null ? "Médicos ilimitados" : `Até ${p.maxDoctors} médicos`}
                    </div>
                  </button>
                );
              })}
            </div>
            <Link to="/planos" className="inline-block text-xs font-medium text-primary hover:underline">
              Comparar planos em detalhes
            </Link>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              2. Dados da clínica
            </legend>
            <Field id="clinic-name" label="Nome da clínica *">
              <input
                id="clinic-name"
                className={inputCls}
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
                  className={inputCls}
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
                  className={inputCls}
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: formatPhone(e.target.value) }))}
                  placeholder="(11) 99999-9999"
                />
              </Field>
            </div>
            <Field id="clinic-address" label="Endereço">
              <input
                id="clinic-address"
                className={inputCls}
                value={form.address}
                onChange={set("address")}
              />
            </Field>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              3. Conta do gestor
            </legend>
            <Field id="admin-name" label="Seu nome *">
              <input
                id="admin-name"
                className={inputCls}
                value={form.adminName}
                onChange={set("adminName")}
                required
              />
            </Field>
            <Field id="admin-email" label="E-mail corporativo *">
              <input
                id="admin-email"
                type="email"
                className={inputCls}
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
                  className={inputCls}
                  value={form.password}
                  onChange={set("password")}
                  required
                />
              </Field>
              <Field id="admin-confirm" label="Confirmar senha *">
                <input
                  id="admin-confirm"
                  type="password"
                  className={inputCls}
                  value={form.confirm}
                  onChange={set("confirm")}
                  required
                />
              </Field>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              4. Pagamento
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                Simulado
              </span>
            </legend>
            <Field id="card-holder" label="Nome no cartão *">
              <input
                id="card-holder"
                className={inputCls}
                value={card.holder}
                onChange={(e) => setCard((c) => ({ ...c, holder: e.target.value }))}
                required
              />
            </Field>
            <Field id="card-number" label="Número do cartão *">
              <div className="relative">
                <CreditCard className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="card-number"
                  inputMode="numeric"
                  className={`${inputCls} pl-11 tracking-wider`}
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
                  className={inputCls}
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
                  className={inputCls}
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

          <fieldset className="space-y-3">
            <legend className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                5. Termos Legais, LGPD e Uso Exclusivo *
              </span>
              <a
                href="/termos"
                target="_blank"
                rel="noreferrer"
                className="font-bold normal-case tracking-normal text-primary hover:underline"
              >
                Ler termos completos
              </a>
            </legend>

            <label
              htmlFor="clinic-exclusive-use"
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                exclusiveUseAccepted
                  ? "border-primary/50 bg-primary/5"
                  : "border-border bg-background hover:border-primary/40"
              }`}
            >
              <input
                id="clinic-exclusive-use"
                type="checkbox"
                checked={exclusiveUseAccepted}
                onChange={(e) => setExclusiveUseAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-primary"
              />
              <span className="text-xs leading-relaxed">
                <strong className="block text-sm text-foreground">
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
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                termsAccepted
                  ? "border-primary/50 bg-primary/5"
                  : "border-border bg-background hover:border-primary/40"
              }`}
            >
              <input
                id="clinic-terms-lgpd"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-primary"
              />
              <span className="text-xs leading-relaxed">
                <strong className="block text-sm text-foreground">
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
            <p className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <button
            id="clinic-register-submit"
            type="submit"
            disabled={loading || !plan || !termsAccepted || !exclusiveUseAccepted}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            {step === "paying"
              ? "Processando pagamento..."
              : step === "creating"
                ? "Criando sua clínica..."
                : selected
                  ? `Assinar ${selected.name} e cadastrar — R$ ${selected.price}/mês`
                  : "Escolha um plano para continuar"}
          </button>
          <p className="text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/login" className="font-bold text-primary hover:underline">
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
      <label htmlFor={id} className="mb-2 block text-sm font-bold">
        {label}
      </label>
      {children}
    </div>
  );
}
