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
    <div className="aero-page pb-16">
      <AppNav />
      <main className="mx-auto max-w-4xl px-4 pt-10">
        <header className="mb-10 text-center">
          <div className="aero-orb mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl">
            <ShieldCheck className="relative z-10 h-8 w-8 text-white" />
          </div>
          <span className="aero-pill inline-block rounded-full border border-sky-300/80 bg-white/85 px-3.5 py-1 text-xs font-extrabold uppercase tracking-widest text-sky-800">
            Versão {TERMS_VERSION}
          </span>
          <h1 className="aero-title-gradient mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Termos de Uso e Proteção de Dados
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold text-sky-950/80 sm:text-base">
            Diretrizes legais sobre privacidade de dados de saúde (LGPD), compromisso de veracidade
            na triagem de sintomas, uso exclusivo do sistema Sem Espera e transferências entre
            hospitais.
          </p>

          <nav className="mt-6 flex flex-wrap justify-center gap-2">
            <a
              href="#lgpd"
              className="aero-btn-glass rounded-full px-4 py-1.5 text-xs font-extrabold"
            >
              1. Proteção de Dados (LGPD)
            </a>
            <a
              href="#veracidade"
              className="aero-btn-glass rounded-full px-4 py-1.5 text-xs font-extrabold"
            >
              2. Veracidade dos Sintomas
            </a>
            <a
              href="#exclusividade"
              className="aero-btn-glass rounded-full px-4 py-1.5 text-xs font-extrabold"
            >
              3. Uso Exclusivo do Sistema
            </a>
            <a
              href="#transferencia"
              className="aero-btn-glass rounded-full px-4 py-1.5 text-xs font-extrabold"
            >
              4. Transferência Hospitalar
            </a>
          </nav>
        </header>

        <div className="space-y-8">
          {/* 1. LGPD */}
          <section id="lgpd" className="aero-glass scroll-mt-24 rounded-3xl p-6 sm:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="aero-orb flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                <Lock className="relative z-10 h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-sky-950">
                  1. Proteção de Dados e Privacidade (LGPD — Lei nº 13.709/2018)
                </h2>
                <p className="text-xs font-semibold text-muted-foreground">
                  Tratamento de dados pessoais e dados sensíveis de saúde
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {LGPD_PRINCIPLES.map((item) => (
                <div key={item.title} className="aero-glass-card rounded-2xl p-4">
                  <h3 className="text-sm font-extrabold text-sky-950">{item.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 2. Veracidade dos sintomas */}
          <section id="veracidade" className="aero-glass scroll-mt-24 rounded-3xl p-6 sm:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="aero-orb-red flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                <Scale className="relative z-10 h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-sky-950">
                  2. Compromisso de Veracidade dos Sintomas e Proibição de Fraude na Fila
                </h2>
                <p className="text-xs font-semibold text-muted-foreground">
                  Responsabilidade legal ao declarar prioridade clínica
                </p>
              </div>
            </div>

            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-300/90 bg-rose-100/80 p-4 text-sm text-rose-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
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
                <div key={law.code} className="aero-glass-card rounded-2xl p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="aero-pill rounded-full border border-rose-700/80 bg-[linear-gradient(180deg,#ff7d95_0%,#eb2549_50%,#c20a2c_100%)] px-3 py-0.5 text-xs font-extrabold text-white">
                      <span className="relative z-10">{law.code}</span>
                    </span>
                    <h3 className="text-sm font-extrabold text-sky-950">{law.title}</h3>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{law.summary}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Uso exclusivo */}
          <section id="exclusividade" className="aero-glass scroll-mt-24 rounded-3xl p-6 sm:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="aero-orb-green flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                <FileCheck2 className="relative z-10 h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-sky-950">
                  3. Termo de Uso Exclusivo e Obrigatório do Sistema Sem Espera
                </h2>
                <p className="text-xs font-semibold text-muted-foreground">
                  Integridade da fila única e conformidade operacional
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="aero-tile-active rounded-2xl p-5">
                <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-sky-950">
                  <Building2 className="h-4 w-4 text-sky-600" />
                  {EXCLUSIVE_USE_CLAUSES.clinic.title}
                </div>
                <p className="text-xs leading-relaxed text-sky-950/80">
                  {EXCLUSIVE_USE_CLAUSES.clinic.text}
                </p>
              </div>

              <div className="aero-tile-active rounded-2xl p-5">
                <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-sky-950">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  {EXCLUSIVE_USE_CLAUSES.patient.title}
                </div>
                <p className="text-xs leading-relaxed text-sky-950/80">
                  {EXCLUSIVE_USE_CLAUSES.patient.text}
                </p>
              </div>
            </div>
          </section>

          {/* 4. Transferência inter-hospitalar */}
          <section id="transferencia" className="aero-glass scroll-mt-24 rounded-3xl p-6 sm:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="aero-orb flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                <ArrowLeftRight className="relative z-10 h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-sky-950">
                  4. Protocolo de Transferência Inter-Hospitalar
                </h2>
                <p className="text-xs font-semibold text-muted-foreground">
                  Continuidade assistencial para hospitais integrados ou externos
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="aero-glass-card rounded-2xl p-5">
                <span className="aero-pill inline-block rounded-full border border-emerald-700/80 bg-[linear-gradient(180deg,#9cf974_0%,#25c956_50%,#0da140_100%)] px-3 py-0.5 text-[11px] font-extrabold uppercase text-white">
                  <span className="relative z-10">Hospital integrado ao Sem Espera</span>
                </span>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {TRANSFER_POLICY.internal}
                </p>
              </div>
              <div className="aero-glass-card rounded-2xl p-5">
                <span className="aero-pill inline-block rounded-full border border-amber-600/80 bg-[linear-gradient(180deg,#ffe678_0%,#f7a910_50%,#de7400_100%)] px-3 py-0.5 text-[11px] font-extrabold uppercase text-amber-950">
                  <span className="relative z-10">Hospital externo (fora do sistema)</span>
                </span>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {TRANSFER_POLICY.external}
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/" className="aero-btn rounded-full px-6 py-3 text-sm font-extrabold">
            <span className="relative z-10">Ir para Pré-Atendimento</span>
          </Link>
          <Link
            to="/cadastro-clinica"
            className="aero-btn-glass rounded-full px-6 py-3 text-sm font-extrabold"
          >
            Cadastrar Clínica / Hospital
          </Link>
        </div>
      </main>
    </div>
  );
}
