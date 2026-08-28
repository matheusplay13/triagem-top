import { createFileRoute } from "@tanstack/react-router";
import { AppNav } from "@/components/AppNav";
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
  const plans = [
    {
      name: "Normal",
      price: "59,99",
      description: "Ideal para clínicas de pequeno porte que precisam de organização.",
      features: ["Triagem digital básica", "Painel de senhas", "Até 3 usuários simultâneos", "Suporte por e-mail"],
      popular: false,
      buttonText: "Começar Normal",
    },
    {
      name: "Pro",
      price: "119,99",
      description: "Para hospitais em crescimento que buscam eficiência máxima.",
      features: ["Tudo do Normal", "Triagem inteligente e relatórios", "Até 10 usuários simultâneos", "Suporte prioritário (WhatsApp)"],
      popular: true,
      buttonText: "Assinar Pro",
    },
    {
      name: "Ultra",
      price: "249,99",
      description: "Para grandes redes hospitalares com alta demanda de pacientes.",
      features: ["Tudo do Pro", "Usuários ilimitados", "API para integração (Sistemas HIS/PEP)", "Painéis personalizados (White-label)", "Gerente de conta dedicado"],
      popular: false,
      buttonText: "Falar com Consultor",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 pt-16">
        <div className="mb-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl text-foreground">
            Escolha o plano <span className="text-primary">ideal</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Escale o atendimento da sua unidade de saúde. 
            Sem taxas ocultas, cancele quando quiser.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-3xl border p-8 shadow-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                plan.popular 
                  ? "border-primary bg-primary/5 md:scale-105 z-10" 
                  : "border-border bg-card"
              }`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full bg-primary px-4 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-md flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> Mais Escolhido
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground min-h-[40px]">
                  {plan.description}
                </p>
              </div>
              
              <div className="mb-6">
                <span className="text-4xl font-black tracking-tighter">R$ {plan.price}</span>
                <span className="text-sm font-medium text-muted-foreground"> / mês</span>
              </div>
              
              <button
                className={`mb-8 w-full rounded-xl py-3.5 text-sm font-bold transition-all active:scale-95 ${
                  plan.popular
                    ? "bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/25"
                    : "bg-muted text-foreground hover:bg-muted/80 border border-border"
                }`}
              >
                {plan.buttonText}
              </button>
              
              <div className="flex-1 space-y-4">
                <p className="text-xs font-bold tracking-widest text-foreground/70 uppercase">O que está incluído</p>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <Check className="h-5 w-5 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
