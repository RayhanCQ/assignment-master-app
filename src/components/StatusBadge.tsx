import { Badge } from "@/components/ui/badge";
import type { Assignment } from "@/lib/store";
import { cn } from "@/lib/utils";

const map: Record<Assignment["status"], { label: string; cls: string }> = {
  belum: { label: "Belum", cls: "bg-muted text-muted-foreground border-border" },
  progress: { label: "Progress", cls: "bg-warning/15 text-warning-foreground border-warning/30" },
  selesai: { label: "Selesai", cls: "bg-success/15 text-success border-success/30" },
};

export function StatusBadge({ status }: { status: Assignment["status"] }) {
  const m = map[status];
  return (
    <Badge variant="outline" className={cn("font-medium", m.cls)}>
      {m.label}
    </Badge>
  );
}

export function DeadlineBadge({ days }: { days: number }) {
  let cls = "bg-muted text-muted-foreground border-border";
  let label = `${days} hari lagi`;
  if (days < 0) {
    cls = "bg-destructive/15 text-destructive border-destructive/30";
    label = `Lewat ${Math.abs(days)} hari`;
  } else if (days <= 3) {
    cls = "bg-destructive/10 text-destructive border-destructive/20";
    label = days === 0 ? "Hari ini" : `${days} hari lagi`;
  } else if (days <= 7) {
    cls = "bg-warning/15 text-warning-foreground border-warning/30";
  }
  return (
    <Badge variant="outline" className={cn("font-medium", cls)}>
      {label}
    </Badge>
  );
}