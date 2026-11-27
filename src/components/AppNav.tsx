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
    <header className="aero-header sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5">
        <Link to="/" className="group flex items-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/90 bg-white/75 p-1 shadow-[0_6px_16px_-6px_rgba(0,130,220,0.4),inset_0_1.5px_0_rgba(255,255,255,0.98)] transition-transform group-hover:scale-105">
            <img
              src={logo}
              alt="Sem Espera — triagem e fila inteligente"
              className="h-9 w-auto object-contain"
            />
          </div>
          <div className="leading-tight">
            <div className="aero-title-gradient text-base font-black tracking-tight">
              Sem Espera
            </div>
            <div className="max-w-[180px] truncate text-[10px] font-bold uppercase tracking-wider text-sky-900/75">
              {session ? session.user.clinicName : "Fila Inteligente"}
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-1.5">
          {links
            .filter((l) => l.show)
            .map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: true }}
                activeProps={{
                  className:
                    "aero-btn border-sky-600/80 text-white shadow-[0_6px_16px_-4px_rgba(0,132,230,0.55)]",
                }}
                className="flex items-center gap-1.5 rounded-full border border-transparent px-3.5 py-1.5 text-sm font-bold text-sky-950/80 transition-all hover:border-white/90 hover:bg-white/65 hover:text-sky-950 hover:shadow-[0_4px_12px_-4px_rgba(0,130,215,0.25),inset_0_1px_0_rgba(255,255,255,0.95)]"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            ))}
          {isAuth && (
            <button
              onClick={logout}
              className="ml-1 flex items-center gap-1.5 rounded-full border border-rose-300/80 bg-white/70 px-3.5 py-1.5 text-sm font-bold text-rose-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] transition-all hover:border-rose-400 hover:bg-rose-500 hover:text-white"
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
