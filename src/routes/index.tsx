import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppNav } from "@/components/AppNav";
import { PriorityBadge } from "@/components/PriorityBadge";
import { addPatient, type Priority } from "@/lib/triage-store";
import { CheckCircle2, HeartPulse, Hospital, AlertCircle, Info } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pré-Atendimento — Sem Espera" },
      { name: "description", content: "Adiante seu atendimento hospitalar." },
    ],
  }),
  component: PatientIntakePage,
});

function PatientIntakePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [doc, setDoc] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [painLevel, setPainLevel] = useState(0);
  const [hasFever, setHasFever] = useState(false);
  const [hasBreathing, setHasBreathing] = useState(false);
  const [hasChestPain, setHasChestPain] = useState(false);
  const [done, setDone] = useState<{ ticket: string; priority: Priority } | null>(null);

  const ageNum = Number(age) || 0;
  const valid = name.trim().length > 1 && ageNum > 0 && ageNum < 130 && symptoms.trim().length > 2;

  function reset() {
    setName(""); setAge(""); setDoc(""); setSymptoms("");
    setPainLevel(0); setHasFever(false); setHasBreathing(false); setHasChestPain(false);
    setDone(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const p = addPatient({
      name: name.trim(), age: ageNum, document: doc.trim(), symptoms: symptoms.trim(),
      painLevel, hasFever, hasBreathingIssue: hasBreathing, hasChestPain,
    });
    setDone({ ticket: p.ticket, priority: p.priority });
    window.scrollTo({ top: 0, behavior: "smooth" });
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
              
              <div className="mt-6 flex justify-center">
                <PriorityBadge priority={done.priority} size="lg" />
              </div>

              {done.priority === "high" && (
                <div className="mt-6 flex items-start gap-3 rounded-xl bg-destructive/10 p-4 text-left text-sm text-destructive">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>
                    <strong>Atenção:</strong> Devido aos seus sintomas, dirija-se 
                    imediatamente ao hospital. Seu caso possui prioridade alta de atendimento.
                  </p>
                </div>
              )}

              <div className="mt-6 flex items-start gap-3 rounded-xl bg-muted p-4 text-left text-sm text-muted-foreground">
                <Hospital className="h-5 w-5 shrink-0" />
                <p>
                  <strong>Ao chegar no hospital:</strong> Dirija-se ao balcão de atendimento 
                  ou totem e informe sua senha <strong>{done.ticket}</strong>.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row justify-center">
                <button
                  onClick={() => navigate({ to: "/queue" })}
                  className="w-full rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Acompanhar a Fila
                </button>
                <button
                  onClick={reset}
                  className="w-full rounded-xl border border-border bg-transparent px-5 py-3.5 text-sm font-bold hover:bg-muted transition-colors"
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
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-primary-foreground shadow-lg mb-6"
            style={{ background: "var(--gradient-hero)" }}
          >
            <HeartPulse className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Pré-Atendimento Digital
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground">
            Está a caminho do hospital? Preencha seus dados agora e <strong>adiante sua triagem</strong> para um atendimento mais rápido e seguro.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <div className="space-y-8 rounded-3xl border border-border bg-card p-6 sm:p-8" style={{ boxShadow: "var(--shadow-card)" }}>
            
            <section>
              <h2 className="mb-4 text-lg font-bold flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">1</span>
                Seus Dados
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Como podemos te chamar?" required>
                  <input
                    value={name} onChange={(e) => setName(e.target.value)}
                    className="input" placeholder="Seu nome completo"
                  />
                </Field>
                <Field label="Sua idade" required>
                  <input
                    type="number" min={0} max={130} value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="input" placeholder="Ex: 35"
                  />
                </Field>
              </div>
              <div className="mt-5">
                <Field label="Documento (CPF ou RG)">
                  <input
                    value={doc} onChange={(e) => setDoc(e.target.value)}
                    className="input" placeholder="Opcional"
                  />
                </Field>
              </div>
            </section>

            <hr className="border-border" />

            <section>
              <h2 className="mb-4 text-lg font-bold flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">2</span>
                Como você está se sentindo?
              </h2>
              
              <Field label="Descreva o que está sentindo" required>
                <textarea
                  value={symptoms} onChange={(e) => setSymptoms(e.target.value)}
                  rows={3} className="input resize-none"
                  placeholder="Ex: Estou com muita dor de cabeça desde ontem à noite..."
                />
              </Field>

              <div className="mt-6">
                <label className="mb-4 flex items-center justify-between font-medium">
                  <span>Qual o nível do seu incômodo/dor?</span>
                  <span 
                    className={`flex h-8 w-10 items-center justify-center rounded-lg font-bold text-white transition-colors
                      ${painLevel <= 4 ? 'bg-priority-low' : painLevel <= 7 ? 'bg-priority-medium' : 'bg-priority-high'}
                    `}
                  >
                    {painLevel}
                  </span>
                </label>
                <input
                  type="range" min={0} max={10} value={painLevel}
                  onChange={(e) => setPainLevel(Number(e.target.value))}
                  style={{ "--progress": `${painLevel * 10}%` } as any}
                  className={`range-input w-full cursor-pointer transition-all
                    ${painLevel <= 4 ? 'text-priority-low' : painLevel <= 7 ? 'text-priority-medium' : 'text-priority-high'}
                  `}
                />
                <div className="mt-3 flex justify-between text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span className={painLevel === 0 ? "text-foreground" : ""}>Sem dor</span>
                  <span className={painLevel === 10 ? "text-destructive" : ""}>Insuportável</span>
                </div>
              </div>
            </section>

            <hr className="border-border" />

            <section>
              <h2 className="mb-4 text-lg font-bold flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">3</span>
                Atenção especial
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Você apresenta algum destes sinais neste momento?
              </p>
              <fieldset className="grid gap-3 sm:grid-cols-1">
                <Check label="Estou com febre" checked={hasFever} onChange={setHasFever} />
                <Check label="Tenho dificuldade respiratória / falta de ar" checked={hasBreathing} onChange={setHasBreathing} />
                <Check label="Estou sentindo dor no peito" checked={hasChestPain} onChange={setHasChestPain} />
              </fieldset>
            </section>
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-muted/50 p-4 text-xs text-muted-foreground">
            <Info className="h-5 w-5 shrink-0 text-primary" />
            <p>
              Suas informações serão analisadas automaticamente para priorizar seu atendimento de acordo com a gravidade. 
              <strong> Em caso de emergência extrema, não aguarde: procure um médico imediatamente.</strong>
            </p>
          </div>

          <button
            type="submit" disabled={!valid}
            className="w-full rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground transition-all disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90 hover:scale-[0.99] active:scale-95"
            style={{ boxShadow: valid ? "var(--shadow-soft)" : undefined }}
          >
            Gerar minha senha digital
          </button>
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

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-foreground/90">
        {label} {required && <span className="text-destructive">*</span>}
      </span>
      {children}
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background p-4 text-sm font-medium transition hover:border-primary/50 hover:bg-primary/5">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-primary" />
      {label}
    </label>
  );
}
