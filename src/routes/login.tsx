import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppNav } from "@/components/AppNav";
import { login, useAuth } from "@/lib/auth-store";
import { Lock, LogIn } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Login da Equipe — Sem Espera" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const isAuth = useAuth();
  const [email, setEmail] = useState("medico@hospital.com");
  const [password, setPassword] = useState("senha123");

  // Se já estiver logado, redireciona para o dashboard
  if (isAuth) {
    navigate({ to: "/dashboard", replace: true });
    return null;
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (email === "medico@hospital.com" && password === "senha123") {
      login();
      navigate({ to: "/dashboard" });
    } else {
      alert("Credenciais incorretas. Use medico@hospital.com / senha123");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="mx-auto flex max-w-sm flex-col items-center justify-center px-4 pt-20">
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Lock className="h-8 w-8" />
        </div>
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Acesso da Equipe</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Área restrita para profissionais de saúde e recepção.
          </p>
        </div>

        <form onSubmit={handleLogin} className="w-full space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div>
            <label className="mb-2 block text-sm font-bold">E-mail corporativo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>
          <button
            type="submit"
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-95"
          >
            <LogIn className="h-4 w-4" /> Entrar no sistema
          </button>
        </form>
      </main>
    </div>
  );
}
