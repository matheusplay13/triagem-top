import { createFileRoute, Link } from "@tanstack/react-router";
import { AppNav } from "@/components/AppNav";
import {
  EXCLUSIVE_USE_CLAUSES,
  LGPD_PRINCIPLES,
  SYMPTOM_TRUTHFULNESS_LAWS,
  TERMS_VERSION,
  TRANSFER_POLICY,
} from "@/lib/legal";
import {
  AlertTriangle,
  ArrowLeftRight,
  Building2,
  FileCheck2,
  Lock,
  Scale,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso e Proteção de Dados (LGPD) — Sem Espera" },
      {
        name: "description",
        content:
          "Política de Proteção de Dados (LGPD), compromisso de veracidade dos sintomas, termo de uso exclusivo do sistema e regras de transferência hospitalar.",
      },
    ],
  }),
  component: TermosPage,
});

function TermosPage() {
  return (
    <div className="min-h-screen bg-background pb-16">
      <AppNav />
      <main className="mx-auto max-w-4xl px-4 pt-10">
        <header className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Versão {TERMS_VERSION}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Termos de Uso e Proteção de Dados
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Diretrizes legais sobre privacidade de dados de saúde (LGPD), compromisso de veracidade
            na triagem de sintomas, uso exclusivo do sistema Sem Espera e transferências entre
            hospitais.
          </p>

          <nav className="mt-6 flex flex-wrap justify-center gap-2">
            <a
              href="#lgpd"
              className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              1. Proteção de Dados (LGPD)
            </a>
            <a
              href="#veracidade"
              className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              2. Veracidade dos Sintomas
            </a>
            <a
              href="#exclusividade"
              className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              3. Uso Exclusivo do Sistema
            </a>
            <a
              href="#transferencia"
              className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              4. Transferência Hospitalar
            </a>
          </nav>
        </header>

        <div className="space-y-8">
          {/* 1. LGPD */}
          <section
            id="lgpd"
            className="scroll-mt-24 rounded-3xl border border-border bg-card p-6 sm:p-8"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  1. Proteção de Dados e Privacidade (LGPD — Lei nº 13.709/2018)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Tratamento de dados pessoais e dados sensíveis de saúde
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {LGPD_PRINCIPLES.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border bg-background p-4"
                >
                  <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 2. Veracidade dos sintomas */}
          <section
            id="veracidade"
            className="scroll-mt-24 rounded-3xl border border-destructive/30 bg-card p-6 sm:p-8"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  2. Compromisso de Veracidade dos Sintomas e Proibição de Fraude na Fila
                </h2>
                <p className="text-xs text-muted-foreground">
                  Responsabilidade legal ao declarar prioridade clínica
                </p>
              </div>
            </div>

            <div className="mb-5 flex items-start gap-3 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>
                <strong>Compromisso obrigatório do paciente:</strong> Ao preencher a pré-triagem, o
                paciente compromete-se a informar apenas sintomas reais e compatíveis com seu estado
                atual de saúde. <strong>Mentir ou exagerar sintomas</strong> para obter prioridade
                indevida e passar à frente de pessoas em risco real de morte compromete a segurança
                hospitalar e sujeita o declarante às sanções legais e administrativas abaixo:
              </p>
            </div>

            <div className="space-y-3">
              {SYMPTOM_TRUTHFULNESS_LAWS.map((law) => (
                <div
                  key={law.code}
                  className="rounded-2xl border border-border bg-background p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-bold text-destructive">
                      {law.code}
                    </span>
                    <h3 className="text-sm font-bold text-foreground">{law.title}</h3>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{law.summary}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Uso exclusivo */}
          <section
            id="exclusividade"
            className="scroll-mt-24 rounded-3xl border border-border bg-card p-6 sm:p-8"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  3. Termo de Uso Exclusivo e Obrigatório do Sistema Sem Espera
                </h2>
                <p className="text-xs text-muted-foreground">
                  Integridade da fila única e conformidade operacional
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
                  <Building2 className="h-4 w-4 text-primary" />
                  {EXCLUSIVE_USE_CLAUSES.clinic.title}
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {EXCLUSIVE_USE_CLAUSES.clinic.text}
                </p>
              </div>

              <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  {EXCLUSIVE_USE_CLAUSES.patient.title}
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {EXCLUSIVE_USE_CLAUSES.patient.text}
                </p>
              </div>
            </div>
          </section>

          {/* 4. Transferência inter-hospitalar */}
          <section
            id="transferencia"
            className="scroll-mt-24 rounded-3xl border border-border bg-card p-6 sm:p-8"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ArrowLeftRight className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  4. Protocolo de Transferência Inter-Hospitalar
                </h2>
                <p className="text-xs text-muted-foreground">
                  Continuidade assistencial para hospitais integrados ou externos
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background p-5">
                <span className="inline-block rounded-full bg-priority-low/15 px-2.5 py-0.5 text-[11px] font-bold uppercase text-priority-low">
                  Hospital integrado ao Sem Espera
                </span>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {TRANSFER_POLICY.internal}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-background p-5">
                <span className="inline-block rounded-full bg-priority-medium/20 px-2.5 py-0.5 text-[11px] font-bold uppercase text-priority-medium-foreground">
                  Hospital externo (fora do sistema)
                </span>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {TRANSFER_POLICY.external}
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Ir para Pré-Atendimento
          </Link>
          <Link
            to="/cadastro-clinica"
            className="rounded-xl border border-border bg-card px-5 py-3 text-sm font-bold text-foreground transition-colors hover:bg-muted"
          >
            Cadastrar Clínica / Hospital
          </Link>
        </div>
      </main>
    </div>
  );
}
