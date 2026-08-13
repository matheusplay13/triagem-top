import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppNav } from "@/components/AppNav";
import { PriorityBadge } from "@/components/PriorityBadge";
import { addPatient, classifyPriority, type Priority } from "@/lib/triage-store";
import { CheckCircle2, Stethoscope } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Triagem — TriageFlow" },
      { name: "description", content: "Cadastro e triagem inteligente de pacientes para unidades de saúde." },
    ],
  }),
  component: TriagePage,
});

function TriagePage() {
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
  const preview: Priority = classifyPriority({
    name, age: ageNum, document: doc, symptoms, painLevel,
    hasFever, hasBreathingIssue: hasBreathing, hasChestPain,
  });

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
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background">
        <AppNav />
        <main className="mx-auto max-w-2xl px-4 py-16">
          <div
            className="rounded-2xl border border-border bg-card p-10 text-center"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h1 className="mt-6 text-2xl font-bold">Paciente cadastrado</h1>
            <p className="mt-1 text-muted-foreground">Triagem concluída com sucesso.</p>

            <div className="mt-8 rounded-xl bg-muted p-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Senha</div>
              <div className="mt-1 text-5xl font-black tracking-tight text-primary">{done.ticket}</div>
              <div className="mt-4 flex justify-center">
                <PriorityBadge priority={done.priority} size="lg" />
              </div>
            </div>

            <div className="mt-8 flex gap-3 justify-center">
              <button
                onClick={reset}
                className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Nova triagem
              </button>
              <button
                onClick={() => navigate({ to: "/queue" })}
                className="rounded-md border border-border bg-background px-5 py-2.5 text-sm font-semibold hover:bg-muted"
              >
                Ver fila
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 flex items-start gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl text-primary-foreground"
            style={{ background: "var(--gradient-hero)" }}
          >
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Triagem de paciente</h1>
            <p className="text-sm text-muted-foreground">
              Preencha os dados e sintomas. A prioridade é calculada automaticamente.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5 rounded-2xl border border-border bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome completo" required>
                <input
                  value={name} onChange={(e) => setName(e.target.value)}
                  className="input" placeholder="Ex: Maria Silva"
                />
              </Field>
              <Field label="Idade" required>
                <input
                  type="number" min={0} max={130} value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="input" placeholder="Ex: 42"
                />
              </Field>
            </div>

            <Field label="Documento (CPF/RG)">
              <input
                value={doc} onChange={(e) => setDoc(e.target.value)}
                className="input" placeholder="Opcional"
              />
            </Field>

            <Field label="Sintomas / queixa principal" required>
              <textarea
                value={symptoms} onChange={(e) => setSymptoms(e.target.value)}
                rows={3} className="input resize-none"
                placeholder="Descreva os sintomas relatados pelo paciente..."
              />
            </Field>

            <div>
              <label className="mb-3 flex items-center justify-between text-sm font-medium">
                <span>Nível de dor</span>
                <span 
                  className={`flex h-7 items-center justify-center rounded-md px-3 font-bold text-white transition-colors
                    ${painLevel <= 4 ? 'bg-priority-low' : painLevel <= 7 ? 'bg-priority-medium' : 'bg-priority-high'}
                  `}
                >
                  {painLevel} / 10
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
              <div className="mt-2 flex justify-between text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <span className={painLevel === 0 ? "text-foreground font-bold" : ""}>Sem dor</span>
                <span className={painLevel === 10 ? "text-destructive font-bold" : ""}>Insuportável</span>
              </div>
            </div>

            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-medium">Sinais clínicos</legend>
              <Check label="Febre" checked={hasFever} onChange={setHasFever} />
              <Check label="Dificuldade respiratória" checked={hasBreathing} onChange={setHasBreathing} />
              <Check label="Dor no peito" checked={hasChestPain} onChange={setHasChestPain} />
            </fieldset>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Classificação prévia</div>
              <div className="mt-3 flex items-center justify-center py-4">
                <PriorityBadge priority={preview} size="lg" />
              </div>
              <p className="text-xs text-muted-foreground">
                Calculada com base em idade, sintomas e sinais clínicos. Atualizada ao vivo.
              </p>
            </div>

            <button
              type="submit" disabled={!valid}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90"
              style={{ boxShadow: valid ? "var(--shadow-soft)" : undefined }}
            >
              Registrar e gerar senha
            </button>

            <div className="rounded-xl bg-muted p-4 text-xs text-muted-foreground space-y-1">
              <div><strong className="text-foreground">Alta:</strong> dor no peito, falta de ar, dor ≥ 8, ≤2 ou ≥65 anos</div>
              <div><strong className="text-foreground">Média:</strong> febre, dor ≥ 5, ≥60 anos</div>
              <div><strong className="text-foreground">Baixa:</strong> demais casos</div>
            </div>
          </aside>
        </form>
      </main>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid var(--color-input);
          background: var(--color-background);
          padding: 0.55rem 0.75rem;
          font-size: 0.875rem;
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
          height: 0.6rem;
          border-radius: 9999px;
          background: linear-gradient(to right, currentColor var(--progress, 0%), var(--color-muted) var(--progress, 0%));
          outline: none;
        }
        .range-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 1.35rem;
          height: 1.35rem;
          border-radius: 50%;
          background: currentColor;
          cursor: pointer;
          transition: transform 0.15s;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        .range-input::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .range-input::-moz-range-thumb {
          width: 1.35rem;
          height: 1.35rem;
          border-radius: 50%;
          background: currentColor;
          cursor: pointer;
          transition: transform 0.15s;
          border: none;
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
      <span className="mb-1.5 block text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </span>
      {children}
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2 text-sm transition hover:bg-muted">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-primary" />
      {label}
    </label>
  );
}
