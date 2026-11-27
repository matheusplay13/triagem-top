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

  return (
    <div className="aero-page pb-16">
      <AppNav />
      <main className="mx-auto flex max-w-sm flex-col items-center justify-center px-4 pt-16 pb-16">
        <div className="aero-orb mb-6 flex h-18 w-18 items-center justify-center rounded-3xl">
          <Lock className="relative z-10 h-9 w-9 text-white" />
        </div>
        <div className="mb-8 text-center">
          <h1 className="aero-title-gradient text-3xl font-black tracking-tight">
            Acesso da Equipe
          </h1>
          <p className="mt-2 text-sm font-semibold text-sky-950/75">
            Área restrita para gestores e médicos cadastrados pela clínica.
          </p>
        </div>

        <form onSubmit={handleLogin} className="aero-glass w-full space-y-4 rounded-3xl p-6">
          <div>
            <label htmlFor="login-email" className="mb-2 block text-sm font-extrabold text-sky-950">
              E-mail corporativo
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="aero-input"
              placeholder="voce@suaclinica.com"
              required
            />
          </div>
          <div>
            <label
              htmlFor="login-password"
              className="mb-2 block text-sm font-extrabold text-sky-950"
            >
              Senha
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="aero-input"
              required
            />
          </div>
          {error && (
            <p className="rounded-2xl border border-rose-300 bg-rose-100/90 px-4 py-2.5 text-sm font-bold text-rose-700">
              {error}
            </p>
          )}
          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="aero-btn mt-2 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-extrabold"
          >
            {loading ? (
              <Loader2 className="relative z-10 h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="relative z-10 h-4 w-4" />
            )}
            <span className="relative z-10">Entrar no sistema</span>
          </button>
        </form>

        <Link
          to="/cadastro-clinica"
          className="aero-btn-glass mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-extrabold"
        >
          <Building2 className="h-4 w-4 text-sky-600" /> Sua clínica ainda não tem conta? Cadastre-se
        </Link>
      </main>
    </div>
  );
}
