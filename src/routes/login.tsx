import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { login, useSession } from "@/lib/auth-store";
import { loginFn } from "@/lib/api/clinic.functions";
import { Building2, Loader2, Lock, LogIn } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login da Equipe — Sem Espera" },
      { name: "description", content: "Acesso restrito para gestores e médicos da clínica." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const session = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Se já estiver logado, redireciona conforme o perfil
  useEffect(() => {
    if (session) {
      navigate({ to: session.user.role === "admin" ? "/clinica" : "/dashboard", replace: true });
    }
  }, [session, navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await loginFn({ data: { email, password } });
      login(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="mx-auto flex max-w-sm flex-col items-center justify-center px-4 pt-20 pb-16">
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Lock className="h-8 w-8" />
        </div>
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Acesso da Equipe</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Área restrita para gestores e médicos cadastrados pela clínica.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="w-full space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm"
        >
          <div>
            <label htmlFor="login-email" className="mb-2 block text-sm font-bold">
              E-mail corporativo
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              placeholder="voce@suaclinica.com"
              required
            />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-2 block text-sm font-bold">
              Senha
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              required
            />
          </div>
          {error && (
            <p className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive">
              {error}
            </p>
          )}
          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Entrar no sistema
          </button>
        </form>

        <Link
          to="/cadastro-clinica"
          className="mt-6 flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <Building2 className="h-4 w-4" /> Sua clínica ainda não tem conta? Cadastre-se
        </Link>
      </main>
    </div>
  );
}
