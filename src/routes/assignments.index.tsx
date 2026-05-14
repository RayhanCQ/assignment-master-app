import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { db, useDB, daysUntil, formatDate, type Assignment } from "@/lib/store";
import { AssignmentDialog } from "@/components/AssignmentDialog";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { DeadlineBadge, StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";

export const Route = createFileRoute("/assignments/")({
  head: () => ({
    meta: [
      { title: "Assignment — Akademik" },
      { name: "description", content: "Lihat semua tugas lintas mata kuliah." },
    ],
  }),
  component: AssignmentsPage,
});

function AssignmentsPage() {
  const { courses, assignments } = useDB();
  const [q, setQ] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("deadline");
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const list = useMemo(() => {
    let arr = [...assignments];
    if (courseFilter !== "all") arr = arr.filter((a) => a.courseId === courseFilter);
    if (statusFilter !== "all") arr = arr.filter((a) => a.status === statusFilter);
    if (q) arr = arr.filter((a) => a.title.toLowerCase().includes(q.toLowerCase()));
    if (sort === "deadline") arr.sort((a, b) => a.deadline.localeCompare(b.deadline));
    if (sort === "title") arr.sort((a, b) => a.title.localeCompare(b.title));
    return arr;
  }, [assignments, q, courseFilter, statusFilter, sort]);

  return (
    <div className="container max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assignment</h1>
          <p className="text-muted-foreground">Semua tugas Anda lintas mata kuliah.</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-1.5" disabled={courses.length === 0}>
          <Plus className="h-4 w-4" /> Tambah Assignment
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Cari nama tugas" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Mata kuliah" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua mata kuliah</SelectItem>
            {courses.map((c) => (<SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua status</SelectItem>
            <SelectItem value="belum">Belum</SelectItem>
            <SelectItem value="progress">Progress</SelectItem>
            <SelectItem value="selesai">Selesai</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="deadline">Deadline terdekat</SelectItem>
            <SelectItem value="title">Nama A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <div className="rounded-full bg-muted p-4 text-muted-foreground"><ClipboardList className="h-7 w-7" /></div>
            <div>
              <p className="font-semibold">Belum ada assignment</p>
              <p className="text-sm text-muted-foreground">
                {courses.length === 0
                  ? "Tambahkan mata kuliah terlebih dahulu sebelum membuat tugas."
                  : "Klik tombol di bawah untuk membuat assignment pertama."}
              </p>
            </div>
            {courses.length > 0 && (
              <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-1.5">
                <Plus className="h-4 w-4" /> Tambah Assignment
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {list.map((a) => {
            const course = courses.find((c) => c.id === a.courseId);
            const days = daysUntil(a.deadline);
            return (
              <Card key={a.id} className="transition-colors hover:bg-muted/30">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{a.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {course ? `${course.code} · ${course.name}` : "Tanpa mata kuliah"} · Deadline {formatDate(a.deadline)}
                    </p>
                    {a.notes && <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{a.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={a.status} />
                    <DeadlineBadge days={days} />
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(a); setOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(a.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AssignmentDialog open={open} onOpenChange={setOpen} initial={editing} />
      <ConfirmDelete
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Hapus assignment?"
        onConfirm={() => {
          if (deleteId) {
            db.deleteAssignment(deleteId);
            toast.success("Assignment dihapus");
            setDeleteId(null);
          }
        }}
      />
    </div>
  );
}