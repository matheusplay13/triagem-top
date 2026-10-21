import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppNav } from "@/components/AppNav";
import { login } from "@/lib/auth-store";
import { registerClinicFn } from "@/lib/api/clinic.functions";
import { Building2, Loader2, ShieldCheck, Stethoscope, Users } from "lucide-react";

export const Route = createFileRoute("/cadastro-clinica")({
  head: () => ({
    meta: [
      { title: "Cadastro de Clínica — Sem Espera" },
      {
        name: "description",
        content: "Cadastre sua clínica, gerencie médicos e acompanhe as filas em tempo real.",
      },
    ],
  }),
  component: CadastroClinicaPage,
});

function CadastroClinicaPage() {
  const navigate = useNavigate();
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password.length < 6) return setError("A senha deve ter pelo menos 6 caracteres.");
    if (form.password !== form.confirm) return setError("As senhas não conferem.");
    setLoading(true);
    try {
      const { confirm: _confirm, ...data } = form;
      const result = await registerClinicFn({ data });
      login({ token: result.token, user: { ...result.user, role: "admin", clinicId: result.user.clinicId! } });
      navigate({ to: "/clinica" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível cadastrar a clínica.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[1fr_1.3fr]">
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            <Building2 className="h-3.5 w-3.5" /> Para clínicas
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight">
            Cadastre sua <span className="text-primary">clínica</span>
          </h1>
          <p className="mt-4 text-muted-foreground">
            Crie a conta do gestor e tenha acesso a um painel exclusivo para acompanhar as filas e
            gerenciar a equipe médica.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              { icon: Users, t: "Filas em tempo real", d: "Veja quem aguarda, quem está em atendimento e chame o próximo." },
              { icon: Stethoscope, t: "Gestão de médicos", d: "Cadastre e-mail e senha de cada médico, desative ou remova acessos." },
              { icon: ShieldCheck, t: "Acesso restrito", d: "Somente e-mails cadastrados pela clínica entram no sistema." },
            ].map(({ icon: Icon, t, d }) => (
              <li key={t} className="flex gap-4 rounded-2xl border border-border bg-card p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold">{t}</div>
                  <div className="text-sm text-muted-foreground">{d}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8 animate-in fade-in slide-in-from-bottom-8 duration-700"
        >
          <fieldset className="space-y-4">
            <legend className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Dados da clínica
            </legend>
            <Field id="clinic-name" label="Nome da clínica *">
              <input id="clinic-name" className={inputCls} value={form.clinicName} onChange={set("clinicName")} required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="clinic-cnpj" label="CNPJ">
                <input id="clinic-cnpj" className={inputCls} value={form.cnpj} onChange={set("cnpj")} placeholder="00.000.000/0000-00" />
              </Field>
              <Field id="clinic-phone" label="Telefone">
                <input id="clinic-phone" className={inputCls} value={form.phone} onChange={set("phone")} placeholder="(11) 99999-9999" />
              </Field>
            </div>
            <Field id="clinic-address" label="Endereço">
              <input id="clinic-address" className={inputCls} value={form.address} onChange={set("address")} />
            </Field>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Conta do gestor
            </legend>
            <Field id="admin-name" label="Seu nome *">
              <input id="admin-name" className={inputCls} value={form.adminName} onChange={set("adminName")} required />
            </Field>
            <Field id="admin-email" label="E-mail corporativo *">
              <input id="admin-email" type="email" className={inputCls} value={form.email} onChange={set("email")} required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="admin-password" label="Senha *">
                <input id="admin-password" type="password" className={inputCls} value={form.password} onChange={set("password")} required />
              </Field>
              <Field id="admin-confirm" label="Confirmar senha *">
                <input id="admin-confirm" type="password" className={inputCls} value={form.confirm} onChange={set("confirm")} required />
              </Field>
            </div>
          </fieldset>

          {error && (
            <p className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive">{error}</p>
          )}

          <button
            id="clinic-register-submit"
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
            Cadastrar clínica
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

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-bold">
        {label}
      </label>
      {children}
    </div>
  );
}
