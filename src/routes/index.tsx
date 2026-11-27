import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppNav } from "@/components/AppNav";
import { PriorityBadge } from "@/components/PriorityBadge";
import { addPatient, usePublicClinics, type Priority } from "@/lib/triage-store";
import { SYMPTOM_TRUTHFULNESS_LAWS } from "@/lib/legal";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HeartPulse,
  Hospital,
  Info,
  Loader2,
  MapPin,
  Scale,
  ShieldCheck,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pré-Atendimento — Sem Espera" },
      { name: "description", content: "Adiante seu atendimento hospitalar escolhendo sua unidade de destino." },
    ],
  }),
  component: PatientIntakePage,
});

interface DoneTicket {
  ticket: string;
  priority: Priority;
  clinicId: string;
  clinicName: string;
  clinicAddress: string | null;
}

function PatientIntakePage() {
  const navigate = useNavigate();
  const clinicsQuery = usePublicClinics();
  const clinics = clinicsQuery.data ?? [];

  const [clinicId, setClinicId] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [doc, setDoc] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [painLevel, setPainLevel] = useState(0);
  const [hasFever, setHasFever] = useState(false);
  const [hasBreathing, setHasBreathing] = useState(false);
  const [hasChestPain, setHasChestPain] = useState(false);

  const [truthfulnessConsent, setTruthfulnessConsent] = useState(false);
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [exclusiveSystemConsent, setExclusiveSystemConsent] = useState(false);
  const [showLaws, setShowLaws] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<DoneTicket | null>(null);

  const ageNum = Number(age) || 0;
  const allConsentsAccepted = truthfulnessConsent && lgpdConsent && exclusiveSystemConsent;
  const valid =
    clinicId.length > 0 &&
    name.trim().length > 1 &&
    ageNum > 0 &&
    ageNum < 130 &&
    symptoms.trim().length > 2 &&
    allConsentsAccepted;

  function reset() {
    setClinicId("");
    setName("");
    setAge("");
    setDoc("");
    setSymptoms("");
    setPainLevel(0);
    setHasFever(false);
    setHasBreathing(false);
    setHasChestPain(false);
    setTruthfulnessConsent(false);
    setLgpdConsent(false);
    setExclusiveSystemConsent(false);
    setError(null);
    setDone(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!clinicId) {
      setError("Selecione o hospital ou clínica para onde você está indo.");
      return;
    }
    if (!allConsentsAccepted) {
      setError(
        "Você precisa confirmar a declaração de veracidade dos sintomas, o consentimento LGPD e o compromisso de uso exclusivo do sistema.",
      );
      return;
    }
    if (!valid) return;

    setSubmitting(true);
    try {
      const p = await addPatient({
        name: name.trim(),
        age: ageNum,
        document: doc.trim(),
        symptoms: symptoms.trim(),
        painLevel,
        hasFever,
        hasBreathingIssue: hasBreathing,
        hasChestPain,
        clinicId,
        lgpdConsent: true,
        truthfulnessConsent: true,
        exclusiveSystemConsent: true,
      });
      const selectedClinic = clinics.find((c) => c.id === clinicId);
      setDone({
        ticket: p.ticket,
        priority: p.priority,
        clinicId,
        clinicName: p.clinic?.name ?? selectedClinic?.name ?? "Unidade selecionada",
        clinicAddress: p.clinic?.address ?? selectedClinic?.address ?? null,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível gerar sua senha.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background">
        <AppNav />
        <main className="mx-auto max-w-lg px-4 py-12">
          <div
            className="overflow-hidden rounded-3xl border border-border bg-card text-center"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="bg-primary px-6 py-8 text-primary-foreground">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <h1 className="mt-4 text-2xl font-bold">Tudo Certo, {name.split(" ")[0]}!</h1>
              <p className="mt-2 text-primary-foreground/90">Seu pré-check-in foi realizado.</p>
            </div>

            <div className="p-8">
              <div className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                Sua Senha Digital
              </div>
              <div className="my-3 text-7xl font-black tracking-tighter text-foreground">
                {done.ticket}
              </div>

              <div className="mt-4 flex justify-center">
                <PriorityBadge priority={done.priority} size="lg" />
              </div>

              {/* Hospital de destino */}
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4 text-left text-sm">
                <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-primary">
                    Hospital / Unidade de Destino
                  </div>
                  <div className="mt-0.5 font-bold text-foreground">{done.clinicName}</div>
                  {done.clinicAddress && (
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {done.clinicAddress}
                    </div>
                  )}
                </div>
              </div>

              {done.priority === "high" && (
                <div className="mt-4 flex items-start gap-3 rounded-xl bg-destructive/10 p-4 text-left text-sm text-destructive">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>
                    <strong>Atenção:</strong> Devido aos seus sintomas, dirija-se imediatamente ao
                    hospital <strong>{done.clinicName}</strong>. Seu caso possui prioridade alta de
                    atendimento.
                  </p>
                </div>
              )}

              <div className="mt-4 flex items-start gap-3 rounded-xl bg-muted p-4 text-left text-sm text-muted-foreground">
                <Hospital className="h-5 w-5 shrink-0" />
                <p>
                  <strong>Ao chegar no hospital:</strong> Dirija-se ao balcão de atendimento ou
                  totem de <strong>{done.clinicName}</strong> e informe sua senha{" "}
                  <strong>{done.ticket}</strong>. A classificação será validada pela triagem
                  presencial.
                </p>
              </div>

              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Termos de Uso, LGPD e Declaração de Veracidade registrados</span>
              </div>

              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  onClick={() =>
                    navigate({ to: "/queue", search: { clinicId: done.clinicId } })
                  }
                  className="w-full rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Acompanhar Fila da Unidade
                </button>
                <button
                  onClick={reset}
                  className="w-full rounded-xl border border-border bg-transparent px-5 py-3.5 text-sm font-bold transition-colors hover:bg-muted"
                >
                  Fazer Novo Check-in
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <AppNav />
      <main className="mx-auto max-w-2xl px-4 pt-10">
        <div className="mb-10 text-center">
          <div
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-primary-foreground shadow-lg"
            style={{ background: "var(--gradient-hero)" }}
          >
            <HeartPulse className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Pré-Atendimento Digital
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground">
            Está a caminho do hospital? Selecione para qual unidade você está indo, preencha seus
            sintomas com veracidade e <strong>adiante sua triagem</strong>.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <div
            className="space-y-8 rounded-3xl border border-border bg-card p-6 sm:p-8"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            {/* ETAPA 1: HOSPITAL DE DESTINO */}
            <section>
              <h2 className="mb-2 flex items-center gap-2 text-lg font-bold">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                  1
                </span>
                Para qual hospital ou clínica você está indo? <span className="text-destructive">*</span>
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Escolha a unidade de destino para que sua senha entre diretamente na fila correta.
              </p>

              {clinicsQuery.isLoading ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-background py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando unidades disponíveis...
                </div>
              ) : clinics.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">
                    Nenhum hospital ou clínica cadastrado no sistema ainda.
                  </p>
                  <p className="mt-1 text-xs">
                    Para enviar pacientes a uma unidade específica, cadastre primeiro um hospital ou
                    clínica na plataforma.
                  </p>
                  <Link
                    to="/cadastro-clinica"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:opacity-90"
                  >
                    <Building2 className="h-3.5 w-3.5" /> Cadastrar Clínica / Hospital
                  </Link>
                </div>
              ) : (
                <div className="grid gap-3" role="radiogroup" aria-label="Hospital de destino">
                  {clinics.map((c) => {
                    const selected = clinicId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setClinicId(c.id)}
                        className={`flex items-start justify-between gap-3 rounded-2xl border p-4 text-left transition-all ${
                          selected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/25"
                            : "border-border bg-background hover:border-primary/40 hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                              selected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <Hospital className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-bold text-foreground">{c.name}</div>
                            {c.address && (
                              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3 shrink-0" />
                                {c.address}
                              </div>
                            )}
                            {c.phone && (
                              <div className="mt-0.5 text-xs text-muted-foreground">
                                Tel: {c.phone}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {c.waitingCount} na fila
                          </span>
                          {selected && (
                            <span className="text-[11px] font-bold text-primary">Selecionado</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <hr className="border-border" />

            {/* ETAPA 2: DADOS DO PACIENTE */}
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                  2
                </span>
                Seus Dados
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Como podemos te chamar?" required>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input"
                    placeholder="Seu nome completo"
                  />
                </Field>
                <Field label="Sua idade" required>
                  <input
                    type="number"
                    min={0}
                    max={130}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="input"
                    placeholder="Ex: 35"
                  />
                </Field>
              </div>
              <div className="mt-5">
                <Field label="Documento (CPF ou RG)">
                  <input
                    value={doc}
                    onChange={(e) => setDoc(e.target.value)}
                    className="input"
                    placeholder="Opcional"
                  />
                </Field>
              </div>
            </section>

            <hr className="border-border" />

            {/* ETAPA 3: SINTOMAS */}
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                  3
                </span>
                Como você está se sentindo?
              </h2>

              <Field label="Descreva o que está sentindo" required>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={3}
                  className="input resize-none"
                  placeholder="Ex: Estou com muita dor de cabeça desde ontem à noite..."
                />
              </Field>

              <div className="mt-6">
                <label className="mb-4 flex items-center justify-between font-medium">
                  <span>Qual o nível do seu incômodo/dor?</span>
                  <span
                    className={`flex h-8 w-10 items-center justify-center rounded-lg font-bold text-white transition-colors
                      ${painLevel <= 4 ? "bg-priority-low" : painLevel <= 7 ? "bg-priority-medium" : "bg-priority-high"}
                    `}
                  >
                    {painLevel}
                  </span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={painLevel}
                  onChange={(e) => setPainLevel(Number(e.target.value))}
                  style={{ "--progress": `${painLevel * 10}%` } as React.CSSProperties}
                  className={`range-input w-full cursor-pointer transition-all
                    ${painLevel <= 4 ? "text-priority-low" : painLevel <= 7 ? "text-priority-medium" : "text-priority-high"}
                  `}
                />
                <div className="mt-3 flex justify-between text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span className={painLevel === 0 ? "text-foreground" : ""}>Sem dor</span>
                  <span className={painLevel === 10 ? "text-destructive" : ""}>Insuportável</span>
                </div>
              </div>
            </section>

            <hr className="border-border" />

            {/* ETAPA 4: SINAIS DE ALERTA */}
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                  4
                </span>
                Atenção especial
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Você apresenta algum destes sinais neste momento?
              </p>
              <fieldset className="grid gap-3 sm:grid-cols-1">
                <Check label="Estou com febre" checked={hasFever} onChange={setHasFever} />
                <Check
                  label="Tenho dificuldade respiratória / falta de ar"
                  checked={hasBreathing}
                  onChange={setHasBreathing}
                />
                <Check
                  label="Estou sentindo dor no peito"
                  checked={hasChestPain}
                  onChange={setHasChestPain}
                />
              </fieldset>
            </section>

            <hr className="border-border" />

            {/* ETAPA 5: TERMOS DE USO, LGPD, VERACIDADE E USO EXCLUSIVO */}
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                    5
                  </span>
                  Termos de Uso, Proteção de Dados e Veracidade{" "}
                  <span className="text-destructive">*</span>
                </h2>
                <a
                  href="/termos"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-primary underline-offset-4 hover:underline"
                >
                  Ler termos completos
                </a>
              </div>

              {/* Aviso legal sobre não mentir nos sintomas */}
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-xs">
                <div className="flex items-start gap-2.5 text-destructive">
                  <Scale className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-bold">
                      Aviso Legal: Proibição de falsificação ou exagero de sintomas
                    </p>
                    <p className="mt-1 leading-relaxed text-foreground/80">
                      Informar sintomas falsos para elevar artificialmente sua prioridade e passar à
                      frente de pacientes mais graves viola o{" "}
                      <strong>Art. 299 (Falsidade Ideológica)</strong> e o{" "}
                      <strong>Art. 132 (Perigo para a vida ou saúde de outrem)</strong> do Código
                      Penal, além de gerar responsabilidade civil (Arts. 186 e 927 do Código Civil).
                      Sua triagem será validada presencialmente pela equipe de saúde e, em caso de
                      má-fé, sua senha poderá ser reclassificada para o final da fila ou cancelada.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowLaws((v) => !v)}
                  className="mt-3 inline-flex items-center gap-1 font-bold text-destructive hover:underline"
                >
                  {showLaws ? (
                    <>
                      Ocultar base legal detalhada <ChevronUp className="h-3.5 w-3.5" />
                    </>
                  ) : (
                    <>
                      Ver leis aplicáveis em detalhes <ChevronDown className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>

                {showLaws && (
                  <ul className="mt-3 space-y-2 border-t border-destructive/20 pt-3">
                    {SYMPTOM_TRUTHFULNESS_LAWS.map((law) => (
                      <li key={law.code} className="text-foreground/85">
                        <strong>{law.code}</strong> ({law.title}): {law.summary}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* 3 Checkboxes obrigatórios */}
              <div className="space-y-3">
                <ConsentCheck
                  id="consent-truthfulness"
                  checked={truthfulnessConsent}
                  onChange={setTruthfulnessConsent}
                  title="Declaração de Veracidade dos Sintomas"
                  description="Comprometo-me a informar exclusivamente a verdade sobre meus sintomas e nível de dor, não mentindo nem exagerando meu estado clínico para obter prioridade indevida e passar na frente de outros pacientes, ciente das penalidades previstas nos Arts. 132 e 299 do Código Penal e Arts. 186 e 927 do Código Civil."
                />

                <ConsentCheck
                  id="consent-lgpd"
                  checked={lgpdConsent}
                  onChange={setLgpdConsent}
                  title="Proteção de Dados e Privacidade (LGPD — Lei nº 13.709/2018)"
                  description="Li e aceito os Termos de Uso e a Política de Proteção de Dados, autorizando o tratamento dos meus dados pessoais e dados sensíveis de saúde para triagem, organização da fila na unidade escolhida e eventual transferência inter-hospitalar."
                />

                <ConsentCheck
                  id="consent-exclusive"
                  checked={exclusiveSystemConsent}
                  onChange={setExclusiveSystemConsent}
                  title="Compromisso de Uso Exclusivo do Sistema Sem Espera"
                  description="Confirmo que utilizo exclusivamente o sistema oficial Sem Espera para este pré-atendimento no hospital selecionado e que cumpro integralmente as regras da fila única, sem registros paralelos ou duplicados."
                />
              </div>
            </section>
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-muted/50 p-4 text-xs text-muted-foreground">
            <Info className="h-5 w-5 shrink-0 text-primary" />
            <p>
              Suas informações serão analisadas automaticamente para priorizar seu atendimento de
              acordo com a gravidade na unidade escolhida.{" "}
              <strong>
                Em caso de emergência extrema, não aguarde: procure um médico imediatamente ou ligue
                192 (SAMU).
              </strong>
            </p>
          </div>

          {error && (
            <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!valid || submitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground transition-all hover:scale-[0.99] hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ boxShadow: valid ? "var(--shadow-soft)" : undefined }}
          >
            {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
            Gerar minha senha digital
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Quer usar em sua clínica ou hospital?{" "}
            <Link
              to="/planos"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Ver planos e preços
            </Link>{" "}
            ·{" "}
            <Link
              to="/termos"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Termos de Uso e LGPD
            </Link>
          </p>
        </form>
      </main>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid var(--color-input);
          background: var(--color-background);
          padding: 0.8rem 1rem;
          font-size: 1rem;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .input:focus {
          border-color: var(--color-ring);
          box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-ring) 20%, transparent);
        }
        .range-input {
          -webkit-appearance: none;
          appearance: none;
          height: 0.75rem;
          border-radius: 9999px;
          background: linear-gradient(to right, currentColor var(--progress, 0%), var(--color-muted) var(--progress, 0%));
          outline: none;
        }
        .range-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 1.5rem;
          height: 1.5rem;
          border-radius: 50%;
          background: currentColor;
          cursor: pointer;
          transition: transform 0.15s;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          border: 2px solid white;
        }
        .range-input::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .range-input::-moz-range-thumb {
          width: 1.5rem;
          height: 1.5rem;
          border-radius: 50%;
          background: currentColor;
          cursor: pointer;
          transition: transform 0.15s;
          border: 2px solid white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        .range-input::-moz-range-thumb:hover {
          transform: scale(1.15);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-foreground/90">
        {label} {required && <span className="text-destructive">*</span>}
      </span>
      {children}
    </label>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background p-4 text-sm font-medium transition hover:border-primary/50 hover:bg-primary/5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 accent-primary"
      />
      {label}
    </label>
  );
}

function ConsentCheck({
  id,
  title,
  description,
  checked,
  onChange,
}: {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
        checked
          ? "border-primary/50 bg-primary/5"
          : "border-border bg-background hover:border-primary/40"
      }`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-primary"
      />
      <span className="text-xs leading-relaxed">
        <strong className="block text-sm text-foreground">{title} *</strong>
        <span className="mt-0.5 block text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}
