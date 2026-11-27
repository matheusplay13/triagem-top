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
      <div className="aero-page pb-16">
        <AppNav />
        <main className="mx-auto max-w-lg px-4 py-12">
          <div className="aero-glass overflow-hidden rounded-3xl text-center">
            <div className="aero-gloss-banner px-6 py-8 text-white">
              <div className="aero-orb-green relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                <CheckCircle2 className="relative z-10 h-9 w-9 text-white" />
              </div>
              <h1 className="relative z-10 mt-4 text-2xl font-black drop-shadow-xs">
                Tudo Certo, {name.split(" ")[0]}!
              </h1>
              <p className="relative z-10 mt-1.5 text-sm font-semibold text-white/95">
                Seu pré-check-in foi realizado.
              </p>
            </div>

            <div className="p-8">
              <div className="text-xs font-extrabold uppercase tracking-widest text-sky-900/70">
                Sua Senha Digital
              </div>
              <div className="aero-title-gradient my-3 text-7xl font-black tracking-tighter">
                {done.ticket}
              </div>

              <div className="mt-4 flex justify-center">
                <PriorityBadge priority={done.priority} size="lg" />
              </div>

              {/* Hospital de destino */}
              <div className="aero-glass-card mt-6 flex items-start gap-3 rounded-2xl p-4 text-left text-sm">
                <div className="aero-orb flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                  <Building2 className="relative z-10 h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-sky-700">
                    Hospital / Unidade de Destino
                  </div>
                  <div className="mt-0.5 font-extrabold text-sky-950">{done.clinicName}</div>
                  {done.clinicAddress && (
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-sky-600" />
                      {done.clinicAddress}
                    </div>
                  )}
                </div>
              </div>

              {done.priority === "high" && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-300/90 bg-rose-100/80 p-4 text-left text-sm text-rose-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                  <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
                  <p>
                    <strong>Atenção:</strong> Devido aos seus sintomas, dirija-se imediatamente ao
                    hospital <strong>{done.clinicName}</strong>. Seu caso possui prioridade alta de
                    atendimento.
                  </p>
                </div>
              )}

              <div className="aero-glass-card mt-4 flex items-start gap-3 rounded-2xl p-4 text-left text-sm text-sky-900/85">
                <Hospital className="h-5 w-5 shrink-0 text-sky-600" />
                <p>
                  <strong>Ao chegar no hospital:</strong> Dirija-se ao balcão de atendimento ou
                  totem de <strong>{done.clinicName}</strong> e informe sua senha{" "}
                  <strong>{done.ticket}</strong>. A classificação será validada pela triagem
                  presencial.
                </p>
              </div>

              <div className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full border border-emerald-300/80 bg-emerald-100/75 px-3.5 py-1 text-xs font-bold text-emerald-800">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Termos de Uso, LGPD e Declaração de Veracidade registrados</span>
              </div>

              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  onClick={() =>
                    navigate({ to: "/queue", search: { clinicId: done.clinicId } })
                  }
                  className="aero-btn w-full rounded-full px-5 py-3.5 text-sm font-extrabold"
                >
                  <span className="relative z-10">Acompanhar Fila da Unidade</span>
                </button>
                <button
                  onClick={reset}
                  className="aero-btn-glass w-full rounded-full px-5 py-3.5 text-sm font-extrabold"
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
    <div className="aero-page pb-16">
      <AppNav />
      <main className="mx-auto max-w-2xl px-4 pt-10">
        <div className="aero-glass mb-8 rounded-3xl p-6 text-center sm:p-8">
          <div className="aero-orb mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl">
            <HeartPulse className="relative z-10 h-10 w-10 text-white" />
          </div>
          <h1 className="aero-title-gradient text-3xl font-black tracking-tight sm:text-5xl">
            Pré-Atendimento Digital
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-base font-semibold text-sky-950/85">
            Está a caminho do hospital? Selecione para qual unidade você está indo, preencha seus
            sintomas com veracidade e <strong className="text-sky-900">adiante sua triagem</strong>.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <div className="aero-glass space-y-8 rounded-3xl p-6 sm:p-8">
            {/* ETAPA 1: HOSPITAL DE DESTINO */}
            <section>
              <h2 className="mb-2 flex items-center gap-2.5 text-lg font-extrabold text-sky-950">
                <span className="aero-orb flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black">
                  <span className="relative z-10">1</span>
                </span>
                <span>
                  Para qual hospital ou clínica você está indo?{" "}
                  <span className="text-rose-600">*</span>
                </span>
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Escolha a unidade de destino para que sua senha entre diretamente na fila correta.
              </p>

              {clinicsQuery.isLoading ? (
                <div className="aero-glass-card flex items-center justify-center gap-2 rounded-2xl py-8 text-sm font-semibold text-sky-900/75">
                  <Loader2 className="h-4 w-4 animate-spin text-sky-600" /> Carregando unidades
                  disponíveis...
                </div>
              ) : clinics.length === 0 ? (
                <div className="aero-glass-card rounded-2xl p-5 text-sm text-muted-foreground">
                  <p className="font-extrabold text-sky-950">
                    Nenhum hospital ou clínica cadastrado no sistema ainda.
                  </p>
                  <p className="mt-1 text-xs">
                    Para enviar pacientes a uma unidade específica, cadastre primeiro um hospital ou
                    clínica na plataforma.
                  </p>
                  <Link
                    to="/cadastro-clinica"
                    className="aero-btn mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-extrabold"
                  >
                    <Building2 className="relative z-10 h-3.5 w-3.5" />
                    <span className="relative z-10">Cadastrar Clínica / Hospital</span>
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
                        className={`flex items-start justify-between gap-3 rounded-2xl p-4 text-left ${
                          selected ? "aero-tile-active" : "aero-tile"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              selected ? "aero-orb" : "aero-orb-green opacity-85"
                            }`}
                          >
                            <Hospital className="relative z-10 h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="font-extrabold text-sky-950">{c.name}</div>
                            {c.address && (
                              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3 shrink-0 text-sky-600" />
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
                          <span className="aero-pill inline-flex items-center gap-1 rounded-full border border-sky-300/80 bg-white/85 px-2.5 py-1 text-xs font-bold text-sky-900">
                            <Users className="relative z-10 h-3 w-3 text-sky-600" />
                            <span className="relative z-10">{c.waitingCount} na fila</span>
                          </span>
                          {selected && (
                            <span className="text-[11px] font-extrabold text-sky-700">
                              Selecionado
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <hr className="border-white/75" />

            {/* ETAPA 2: DADOS DO PACIENTE */}
            <section>
              <h2 className="mb-4 flex items-center gap-2.5 text-lg font-extrabold text-sky-950">
                <span className="aero-orb flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black">
                  <span className="relative z-10">2</span>
                </span>
                Seus Dados
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Como podemos te chamar?" required>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="aero-input"
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
                    className="aero-input"
                    placeholder="Ex: 35"
                  />
                </Field>
              </div>
              <div className="mt-5">
                <Field label="Documento (CPF ou RG)">
                  <input
                    value={doc}
                    onChange={(e) => setDoc(e.target.value)}
                    className="aero-input"
                    placeholder="Opcional"
                  />
                </Field>
              </div>
            </section>

            <hr className="border-white/75" />

            {/* ETAPA 3: SINTOMAS */}
            <section>
              <h2 className="mb-4 flex items-center gap-2.5 text-lg font-extrabold text-sky-950">
                <span className="aero-orb flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black">
                  <span className="relative z-10">3</span>
                </span>
                Como você está se sentindo?
              </h2>

              <Field label="Descreva o que está sentindo" required>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={3}
                  className="aero-input resize-none"
                  placeholder="Ex: Estou com muita dor de cabeça desde ontem à noite..."
                />
              </Field>

              <div className="mt-6">
                <label className="mb-4 flex items-center justify-between font-bold text-sky-950">
                  <span>Qual o nível do seu incômodo/dor?</span>
                  <span
                    className={`aero-pill flex h-9 w-12 items-center justify-center rounded-full font-black text-white transition-colors ${
                      painLevel <= 4
                        ? "border border-emerald-700/80 bg-[linear-gradient(180deg,#9cf974_0%,#25c956_50%,#0da140_100%)]"
                        : painLevel <= 7
                          ? "border border-amber-600/80 bg-[linear-gradient(180deg,#ffe678_0%,#f7a910_50%,#de7400_100%)]"
                          : "border border-rose-700/80 bg-[linear-gradient(180deg,#ff7d95_0%,#eb2549_50%,#c20a2c_100%)]"
                    }`}
                  >
                    <span className="relative z-10">{painLevel}</span>
                  </span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={painLevel}
                  onChange={(e) => setPainLevel(Number(e.target.value))}
                  style={{ "--progress": `${painLevel * 10}%` } as React.CSSProperties}
                  className={`aero-range w-full cursor-pointer transition-all ${
                    painLevel <= 4
                      ? "text-priority-low"
                      : painLevel <= 7
                        ? "text-priority-medium"
                        : "text-priority-high"
                  }`}
                />
                <div className="mt-3 flex justify-between text-[11px] font-extrabold uppercase tracking-widest text-sky-900/70">
                  <span className={painLevel === 0 ? "text-emerald-700" : ""}>Sem dor</span>
                  <span className={painLevel === 10 ? "text-rose-600" : ""}>Insuportável</span>
                </div>
              </div>
            </section>

            <hr className="border-white/75" />

            {/* ETAPA 4: SINAIS DE ALERTA */}
            <section>
              <h2 className="mb-4 flex items-center gap-2.5 text-lg font-extrabold text-sky-950">
                <span className="aero-orb flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black">
                  <span className="relative z-10">4</span>
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

            <hr className="border-white/75" />

            {/* ETAPA 5: TERMOS DE USO, LGPD, VERACIDADE E USO EXCLUSIVO */}
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2.5 text-lg font-extrabold text-sky-950">
                  <span className="aero-orb-green flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black">
                    <span className="relative z-10">5</span>
                  </span>
                  <span>
                    Termos de Uso, Proteção de Dados e Veracidade{" "}
                    <span className="text-rose-600">*</span>
                  </span>
                </h2>
                <a
                  href="/termos"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-extrabold text-sky-700 underline-offset-4 hover:underline"
                >
                  Ler termos completos
                </a>
              </div>

              {/* Aviso legal sobre não mentir nos sintomas */}
              <div className="rounded-2xl border border-rose-300/85 bg-rose-50/85 p-4 text-xs shadow-[inset_0_1.5px_0_rgba(255,255,255,0.9)]">
                <div className="flex items-start gap-2.5 text-rose-700">
                  <Scale className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-extrabold">
                      Aviso Legal: Proibição de falsificação ou exagero de sintomas
                    </p>
                    <p className="mt-1 leading-relaxed text-sky-950/85">
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
                  className="mt-3 inline-flex items-center gap-1 font-extrabold text-rose-700 hover:underline"
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
                  <ul className="mt-3 space-y-2 border-t border-rose-200/90 pt-3">
                    {SYMPTOM_TRUTHFULNESS_LAWS.map((law) => (
                      <li key={law.code} className="text-sky-950/85">
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

          <div className="aero-glass-card flex items-start gap-3 rounded-2xl p-4 text-xs text-sky-900/85">
            <Info className="h-5 w-5 shrink-0 text-sky-600" />
            <p>
              Suas informações serão analisadas automaticamente para priorizar seu atendimento de
              acordo com a gravidade na unidade escolhida.{" "}
              <strong className="text-sky-950">
                Em caso de emergência extrema, não aguarde: procure um médico imediatamente ou ligue
                192 (SAMU).
              </strong>
            </p>
          </div>

          {error && (
            <p className="rounded-2xl border border-rose-300 bg-rose-100/90 px-4 py-3 text-sm font-bold text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!valid || submitting}
            className="aero-btn flex w-full items-center justify-center gap-2 rounded-full py-4 text-base font-extrabold"
          >
            {submitting && <Loader2 className="relative z-10 h-5 w-5 animate-spin" />}
            <span className="relative z-10">Gerar minha senha digital</span>
          </button>

          <p className="aero-glass-card mx-auto w-fit rounded-full px-5 py-2 text-center text-xs font-semibold text-sky-950/85">
            Quer usar em sua clínica ou hospital?{" "}
            <Link
              to="/planos"
              className="font-extrabold text-sky-800 underline-offset-4 hover:underline"
            >
              Ver planos e preços
            </Link>{" "}
            ·{" "}
            <Link
              to="/termos"
              className="font-extrabold text-sky-800 underline-offset-4 hover:underline"
            >
              Termos de Uso e LGPD
            </Link>
          </p>
        </form>
      </main>
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
      <span className="mb-2 block text-sm font-extrabold text-sky-950">
        {label} {required && <span className="text-rose-600">*</span>}
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
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-2xl p-4 text-sm font-bold text-sky-950 ${
        checked ? "aero-tile-active" : "aero-tile"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 accent-sky-600"
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
      className={`flex cursor-pointer items-start gap-3 rounded-2xl p-4 ${
        checked ? "aero-tile-active" : "aero-tile"
      }`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-sky-600"
      />
      <span className="text-xs leading-relaxed">
        <strong className="block text-sm font-extrabold text-sky-950">{title} *</strong>
        <span className="mt-0.5 block text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}
