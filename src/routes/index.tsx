import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { BookOpen, ClipboardList, AlertTriangle, CheckCircle2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDB, daysUntil, formatDate } from "@/lib/store";
import { DeadlineBadge, StatusBadge } from "@/components/StatusBadge";
import { useState } from "react";
import { AssignmentDialog } from "@/components/AssignmentDialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Akademik" },
      { name: "description", content: "Ringkasan mata kuliah dan tugas Anda." },
    ],
  }),
  component: Index,
});

function Index() {
  const { courses, assignments } = useDB();
  const [openAdd, setOpenAdd] = useState(false);

  const upcoming = assignments
    .filter((a) => a.status !== "selesai")
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 5);

  const stats = [
    { label: "Total Mata Kuliah", value: courses.length, icon: BookOpen, tone: "text-primary" },
    { label: "Total Assignment", value: assignments.length, icon: ClipboardList, tone: "text-primary" },
    {
      label: "Deadline Mendekat",
      value: assignments.filter((a) => a.status !== "selesai" && daysUntil(a.deadline) <= 3).length,
      icon: AlertTriangle,
      tone: "text-destructive",
    },
    {
      label: "Tugas Selesai",
      value: assignments.filter((a) => a.status === "selesai").length,
      icon: CheckCircle2,
      tone: "text-success",
    },
  ];

  return (
    <div className="container max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Ringkasan aktivitas akademik Anda.</p>
        </div>
        <Button onClick={() => setOpenAdd(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Tambah Assignment
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="overflow-hidden">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-3xl font-bold">{s.value}</p>
              </div>
              <div className={`rounded-xl bg-muted p-3 ${s.tone}`}>
                <s.icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Deadline Mendekat</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/assignments">Lihat semua</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <EmptyState
                title="Tidak ada deadline aktif"
                desc="Semua tugas Anda sudah selesai. Saatnya rebahan."
              />
            ) : (
              <ul className="divide-y divide-border">
                {upcoming.map((a) => {
                  const course = courses.find((c) => c.id === a.courseId);
                  return (
                    <li key={a.id} className="flex items-center justify-between py-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{a.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {course?.code} · {course?.name} · {formatDate(a.deadline)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={a.status} />
                        <DeadlineBadge days={daysUntil(a.deadline)} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mata Kuliah Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <EmptyState title="Belum ada mata kuliah" desc="Tambahkan dari menu Mata Kuliah." />
            ) : (
              <ul className="space-y-2">
                {courses.slice(0, 5).map((c) => {
                  const count = assignments.filter((a) => a.courseId === c.id).length;
                  return (
                    <li key={c.id}>
                      <Link
                        to="/courses/$id"
                        params={{ id: c.id }}
                        className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.code} · Sem {c.semester}</p>
                        </div>
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">{count} tugas</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <AssignmentDialog open={openAdd} onOpenChange={setOpenAdd} />
    </div>
  );
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
