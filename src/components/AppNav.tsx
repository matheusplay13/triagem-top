import { Link } from "@tanstack/react-router";
import { Activity, ClipboardList, LayoutDashboard, Tv } from "lucide-react";

const links = [
  { to: "/", label: "Triagem", icon: ClipboardList },
  { to: "/queue", label: "Fila", icon: Tv },
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
];

export function AppNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-primary-foreground"
            style={{ background: "var(--gradient-hero)" }}
          >
            <Activity className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-tight">TriageFlow</div>
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
