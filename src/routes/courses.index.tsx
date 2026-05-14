import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db, useDB, type Course } from "@/lib/store";
import { CourseDialog } from "@/components/CourseDialog";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { toast } from "sonner";

export const Route = createFileRoute("/courses/")({
  head: () => ({
    meta: [
      { title: "Mata Kuliah — Akademik" },
      { name: "description", content: "Kelola mata kuliah Anda." },
    ],
  }),
  component: CoursesPage,
});

function CoursesPage() {
  const { courses, assignments } = useDB();
  const [q, setQ] = useState("");
  const [sem, setSem] = useState<string>("all");
  const [editing, setEditing] = useState<Course | null>(null);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return courses
      .filter((c) => (sem === "all" ? true : String(c.semester) === sem))
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q.toLowerCase()) ||
          c.code.toLowerCase().includes(q.toLowerCase()),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [courses, q, sem]);

  const semesters = Array.from(new Set(courses.map((c) => c.semester))).sort((a, b) => a - b);

  return (
    <div className="container max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mata Kuliah</h1>
          <p className="text-muted-foreground">Daftar semua mata kuliah Anda.</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-1.5">
          <Plus className="h-4 w-4" /> Tambah Mata Kuliah
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Cari nama atau kode mata kuliah" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={sem} onValueChange={setSem}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Semester" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua semester</SelectItem>
            {semesters.map((s) => (
              <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <div className="rounded-full bg-muted p-4 text-muted-foreground"><BookOpen className="h-7 w-7" /></div>
            <div>
              <p className="font-semibold">Belum ada mata kuliah</p>
              <p className="text-sm text-muted-foreground">Klik tombol di bawah untuk membuat mata kuliah pertama.</p>
            </div>
            <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-1.5">
              <Plus className="h-4 w-4" /> Tambah Mata Kuliah
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const count = assignments.filter((a) => a.courseId === c.id).length;
            return (
              <Card key={c.id} className="group transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link to="/courses/$id" params={{ id: c.id }} className="block truncate text-lg font-semibold hover:underline">
                        {c.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">{c.code} · Semester {c.semester}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {count} tugas
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Button asChild size="sm" variant="secondary" className="flex-1">
                      <Link to="/courses/$id" params={{ id: c.id }}>Detail</Link>
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => { setEditing(c); setOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => setDeleteId(c.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CourseDialog open={open} onOpenChange={setOpen} initial={editing} />
      <ConfirmDelete
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Hapus mata kuliah?"
        description="Semua assignment terkait juga akan dihapus."
        onConfirm={() => {
          if (deleteId) {
            db.deleteCourse(deleteId);
            toast.success("Mata kuliah dihapus");
            setDeleteId(null);
          }
        }}
      />
    </div>
  );
}