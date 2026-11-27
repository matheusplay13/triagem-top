import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AeroBackdrop } from "@/components/AeroBackdrop";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="aero-page flex min-h-screen items-center justify-center px-4">
      <div className="aero-glass max-w-md rounded-3xl p-8 text-center">
        <h1 className="aero-title-gradient text-7xl font-black">404</h1>
        <h2 className="mt-4 text-xl font-bold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          O endereço que você procura não existe ou foi movido.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="aero-btn inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-bold"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="aero-page flex min-h-screen items-center justify-center px-4">
      <div className="aero-glass max-w-md rounded-3xl p-8 text-center">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Não foi possível carregar esta página
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ocorreu um erro inesperado. Tente novamente ou volte para a página inicial.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="aero-btn inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="aero-btn-glass inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Sem Espera — Triagem e Fila Inteligente" },
      {
        name: "description",
        content: "Triagem automática e fila inteligente para unidades de saúde.",
      },
      { property: "og:title", content: "Sem Espera — Triagem e Fila Inteligente" },
      {
        property: "og:description",
        content: "Triagem automática e fila inteligente para unidades de saúde.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Nunito:wght@500;600;700;800;900&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AeroBackdrop />
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
