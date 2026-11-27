import { Link } from "@tanstack/react-router";
import {
  Building2,
  LayoutDashboard,
  LogIn,
  LogOut,
  ShieldCheck,
  Smartphone,
  Tv,
} from "lucide-react";
import logo from "@/assets/sem-espera.png";
import { useSession, logout } from "@/lib/auth-store";

export function AppNav() {
  const session = useSession();
  const isAuth = !!session;
  const isAdmin = session?.user.role === "admin";

  const links = [
    { to: "/" as const, label: "Meu Atendimento", icon: Smartphone, show: true },
    { to: "/queue" as const, label: "Telão de Senhas", icon: Tv, show: true },
    { to: "/dashboard" as const, label: "Recepção / Médico", icon: LayoutDashboard, show: isAuth },
    { to: "/clinica" as const, label: "Gestão da Clínica", icon: Building2, show: isAdmin },
    { to: "/termos" as const, label: "Termos e LGPD", icon: ShieldCheck, show: true },
    { to: "/login" as const, label: "Área da Clínica", icon: LogIn, show: !isAuth },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src={logo}
            alt="Sem Espera — triagem e fila inteligente"
            className="h-10 w-auto"
          />
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-tight">Sem Espera</div>
            <div className="max-w-[180px] truncate text-[10px] uppercase tracking-wider text-muted-foreground">
              {session ? session.user.clinicName : "Fila Inteligente"}
            </div>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          {links
            .filter((l) => l.show)
            .map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: true }}
                activeProps={{ className: "bg-accent text-accent-foreground" }}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            ))}
          {isAuth && (
            <button
              onClick={logout}
              className="ml-2 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              title="Sair da área médica"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Sair</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
