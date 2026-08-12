import { Link } from "@tanstack/react-router";
import { ClipboardList, LayoutDashboard, Tv } from "lucide-react";
import logo from "@/assets/sem-espera-logo.png.asset.json";

const links = [
  { to: "/", label: "Triagem", icon: ClipboardList },
  { to: "/queue", label: "Fila", icon: Tv },
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
];

export function AppNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src={logo.url}
            alt="Sem Espera — triagem e fila inteligente"
            className="h-10 w-auto"
          />
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-tight">Sem Espera</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Fila Inteligente
            </div>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: true }}
              activeProps={{ className: "bg-accent text-accent-foreground" }}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
