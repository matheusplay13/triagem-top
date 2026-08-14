import type { Priority } from "@/lib/triage-store";
import { priorityLabel } from "@/lib/triage-store";
import { AlertTriangle, Activity, Leaf } from "lucide-react";

const styles: Record<Priority, string> = {
  high: "bg-priority-high text-priority-high-foreground",
  medium: "bg-priority-medium text-priority-medium-foreground",
  low: "bg-priority-low text-priority-low-foreground",
};

const Icons: Record<Priority, typeof AlertTriangle> = {
  high: AlertTriangle,
  medium: Activity,
  low: Leaf,
};

export function PriorityBadge({ priority, size = "md" }: { priority: Priority; size?: "sm" | "md" | "lg" }) {
  const Icon = Icons[priority];
  const sizeCls =
    size === "lg"
      ? "px-4 py-2 text-base"
      : size === "sm"
        ? "px-2 py-0.5 text-xs"
        : "px-3 py-1 text-sm";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${styles[priority]} ${sizeCls}`}>
      <Icon className={size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5"} />
      {priorityLabel[priority]}
    </span>
  );
}
