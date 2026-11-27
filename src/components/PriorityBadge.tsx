import type { Priority } from "@/lib/triage-store";
import { priorityLabel } from "@/lib/triage-store";
import { AlertTriangle, Activity, Leaf } from "lucide-react";

const styles: Record<Priority, string> = {
  high: "border border-rose-700/80 text-white [text-shadow:0_1px_1px_rgba(120,0,24,0.45)] bg-[linear-gradient(180deg,#ff7d95_0%,#f02a4e_48%,#cc0e32_52%,#e83656_100%)]",
  medium:
    "border border-amber-600/80 text-amber-950 bg-[linear-gradient(180deg,#fff08a_0%,#ffc226_48%,#eb8b00_52%,#ffbe2e_100%)]",
  low: "border border-emerald-700/80 text-white [text-shadow:0_1px_1px_rgba(0,72,28,0.45)] bg-[linear-gradient(180deg,#9ef976_0%,#34d65e_48%,#0ea842_52%,#2dd666_100%)]",
};

const Icons: Record<Priority, typeof AlertTriangle> = {
  high: AlertTriangle,
  medium: Activity,
  low: Leaf,
};

export function PriorityBadge({
  priority,
  size = "md",
}: {
  priority: Priority;
  size?: "sm" | "md" | "lg";
}) {
  const Icon = Icons[priority];
  const sizeCls =
    size === "lg"
      ? "px-5 py-2 text-base"
      : size === "sm"
        ? "px-2.5 py-0.5 text-xs"
        : "px-3.5 py-1 text-sm";
  return (
    <span
      className={`aero-pill inline-flex items-center gap-1.5 rounded-full font-extrabold ${styles[priority]} ${sizeCls}`}
    >
      <Icon className={size === "lg" ? "relative z-10 h-4 w-4" : "relative z-10 h-3.5 w-3.5"} />
      <span className="relative z-10">{priorityLabel[priority]}</span>
    </span>
  );
}
