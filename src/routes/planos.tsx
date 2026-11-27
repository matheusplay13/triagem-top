import { createFileRoute, Link } from "@tanstack/react-router";
import { AppNav } from "@/components/AppNav";
import { PLAN_LIST } from "@/lib/plans";
import { Check, Crown, Sparkles, Star } from "lucide-react";

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
    <div className="aero-page pb-20">
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 pt-10">
        <div className="aero-glass mx-auto mb-12 max-w-3xl rounded-3xl p-6 text-center sm:p-8">
          <div className="aero-orb mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl">
            <Crown className="relative z-10 h-8 w-8 text-white" />
          </div>
          <h1 className="aero-title-gradient text-4xl font-black tracking-tight sm:text-5xl">
            Escolha o plano ideal
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base font-semibold text-sky-950/85 sm:text-lg">
            Escale o atendimento da sua unidade de saúde com triagem inteligente, fila única e
            transferências integradas.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {PLAN_LIST.map((plan) => {
            const isPopular = !!plan.popular;
            const isUltra = plan.id === "ultra";

            return (
              <div
                key={plan.id}
                className={`aero-glass relative flex flex-col rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1.5 ${
                  isPopular
                    ? "ring-2 ring-sky-400/80 md:scale-105 z-10"
                    : ""
                }`}
              >
                {isPopular && (
                  <div className="aero-pill absolute -top-4 left-0 right-0 mx-auto flex w-fit items-center gap-1.5 rounded-full border border-sky-700/80 bg-[linear-gradient(180deg,#64e2ff_0%,#0ea9f5_48%,#007dd8_52%,#22bdf5_100%)] px-4 py-1 text-xs font-extrabold uppercase tracking-wider text-white">
                    <Star className="relative z-10 h-3.5 w-3.5 fill-current" />
                    <span className="relative z-10">Mais Escolhido</span>
                  </div>
                )}

                <div className="mb-6 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-black text-sky-950">{plan.name}</h3>
                    <p className="mt-1.5 min-h-[40px] text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                      isUltra ? "aero-orb-green" : "aero-orb"
                    }`}
                  >
                    {plan.id === "normal" ? (
                      <Sparkles className="relative z-10 h-5 w-5" />
                    ) : (
                      <Crown className="relative z-10 h-5 w-5" />
                    )}
                  </div>
                </div>

                <div className="aero-glass-card mb-6 rounded-2xl px-4 py-3">
                  <span className="aero-title-gradient text-4xl font-black tracking-tighter">
                    R$ {plan.price}
                  </span>
                  <span className="text-sm font-bold text-muted-foreground"> / mês</span>
                </div>

                <div className="flex-1 space-y-4">
                  <p className="text-xs font-extrabold uppercase tracking-widest text-sky-900/75">
                    O que está incluído
                  </p>
                  <ul className="space-y-3">
                    {plan.highlights.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-sm font-medium text-sky-950/85"
                      >
                        <span className="aero-orb-green mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                          <Check className="relative z-10 h-3 w-3 text-white" />
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  to="/cadastro-clinica"
                  search={{ plan: plan.id }}
                  className={`mt-8 flex w-full items-center justify-center rounded-full py-3.5 text-sm font-extrabold ${
                    isPopular
                      ? "aero-btn"
                      : isUltra
                        ? "aero-btn-green"
                        : "aero-btn-glass"
                  }`}
                >
                  <span className="relative z-10">
                    {isPopular
                      ? `Assinar ${plan.name}`
                      : isUltra
                        ? `Escolher ${plan.name}`
                        : `Começar ${plan.name}`}
                  </span>
                </Link>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
