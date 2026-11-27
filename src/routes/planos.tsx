import { createFileRoute, Link } from "@tanstack/react-router";
import { AppNav } from "@/components/AppNav";
import { PLAN_LIST } from "@/lib/plans";
import { Check, Star } from "lucide-react";

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos e Preços — Sem Espera" },
      { name: "description", content: "Escolha o melhor plano para a sua clínica ou hospital." },
    ],
  }),
  component: PlanosPage,
});

function PlanosPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 pt-16">
        <div className="mb-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            Escolha o plano <span className="text-primary">ideal</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Escale o atendimento da sua unidade de saúde. Sem taxas ocultas, cancele quando quiser.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
          {PLAN_LIST.map((plan, index) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-3xl border p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                plan.popular
                  ? "z-10 border-primary bg-primary/5 md:scale-105"
                  : "border-border bg-card"
              }`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-0 right-0 mx-auto flex w-fit items-center gap-1 rounded-full bg-primary px-4 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-md">
                  <Star className="h-3 w-3 fill-current" /> Mais Escolhido
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="mt-2 min-h-[40px] text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-black tracking-tighter">R$ {plan.price}</span>
                <span className="text-sm font-medium text-muted-foreground"> / mês</span>
              </div>

              <div className="flex-1 space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-foreground/70">
                  O que está incluído
                </p>
                <ul className="space-y-3">
                  {plan.highlights.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <Check className="h-5 w-5 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to="/cadastro-clinica"
                search={{ plan: plan.id }}
                className={`mt-8 block w-full rounded-xl py-3.5 text-center text-sm font-bold transition-all active:scale-95 ${
                  plan.popular
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:opacity-90"
                    : "border border-border bg-muted text-foreground hover:bg-muted/80"
                }`}
              >
                {plan.popular ? `Assinar ${plan.name}` : `Começar ${plan.name}`}
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
