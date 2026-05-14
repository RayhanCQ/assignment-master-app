import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { db, useDB, daysUntil, formatDate, type Assignment } from "@/lib/store";
import { CourseDialog } from "@/components/CourseDialog";
import { AssignmentDialog } from "@/components/AssignmentDialog";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { DeadlineBadge, StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";

export const Route = createFileRoute("/courses/$id")({
  component: CourseDetail,
});

function CourseDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { courses, assignments } = useDB();
  const course = courses.find((c) => c.id === id);

  const [filter, setFilter] = useState<string>("all");
  const [sort, setSort] = useState<string>("deadline");
  const [editCourse, setEditCourse] = useState(false);
  const [deleteCourse, setDeleteCourse] = useState(false);
  const [editAssign, setEditAssign] = useState<Assignment | null>(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [deleteAssign, setDeleteAssign] = useState<string | null>(null);

  const list = useMemo(() => {
    let arr = assignments.filter((a) => a.courseId === id);
    if (filter !== "all") arr = arr.filter((a) => a.status === filter);
    if (sort === "deadline") arr.sort((a, b) => a.deadline.localeCompare(b.deadline));
    if (sort === "title") arr.sort((a, b) => a.title.localeCompare(b.title));
    return arr;
  }, [assignments, id, filter, sort]);

  if (!course) {
    return (
      <div className="container max-w-3xl p-8 text-center">
        <p className="text-lg font-medium">Mata kuliah tidak ditemukan.</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/courses">Kembali</Link></Button>
      </div>
    );
  }

  const total = assignments.filter((a) => a.courseId === id).length;
  const done = assignments.filter((a) => a.courseId === id && a.status === "selesai").length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="container max-w-7xl space-y-6 p-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1">
          <Link to="/courses"><ArrowLeft className="h-4 w-4" /> Kembali</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{course.code} · Semester {course.semester}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">{course.name}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditCourse(true)} className="gap-1.5"><Pencil className="h-4 w-4" /> Edit</Button>
            <Button variant="outline" onClick={() => setDeleteCourse(true)} className="gap-1.5 text-destructive">
              <Trash2 className="h-4 w-4" /> Hapus
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Total Tugas</p><p className="mt-1 text-3xl font-bold">{total}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Selesai</p><p className="mt-1 text-3xl font-bold text-success">{done}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Progress</p><div className="mt-2 flex items-center gap-3"><Progress value={pct} /><span className="text-sm font-semibold">{pct}%</span></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle>Assignment Mata Kuliah Ini</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                <SelectItem value="belum">Belum</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="selesai">Selesai</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="deadline">Deadline terdekat</SelectItem>
                <SelectItem value="title">Nama A-Z</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => { setEditAssign(null); setOpenAdd(true); }} className="gap-1.5">
              <Plus className="h-4 w-4" /> Tambah
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-10 text-center">
              <p className="font-medium">Belum ada assignment.</p>
              <p className="mt-1 text-sm text-muted-foreground">Klik tombol tambah untuk membuat assignment pertama.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Tugas</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{formatDate(a.deadline)}</span>
                        <DeadlineBadge days={daysUntil(a.deadline)} />
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge status={a.status} /></TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => { setEditAssign(a); setOpenAdd(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteAssign(a.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CourseDialog open={editCourse} onOpenChange={setEditCourse} initial={course} />
      <AssignmentDialog open={openAdd} onOpenChange={setOpenAdd} initial={editAssign} defaultCourseId={course.id} />
      <ConfirmDelete
        open={deleteCourse}
        onOpenChange={setDeleteCourse}
        title="Hapus mata kuliah?"
        description="Semua assignment terkait juga akan dihapus."
        onConfirm={() => {
          db.deleteCourse(course.id);
          toast.success("Mata kuliah dihapus");
          navigate({ to: "/courses" });
        }}
      />
      <ConfirmDelete
        open={!!deleteAssign}
        onOpenChange={(v) => !v && setDeleteAssign(null)}
        title="Hapus assignment?"
        onConfirm={() => {
          if (deleteAssign) {
            db.deleteAssignment(deleteAssign);
            toast.success("Assignment dihapus");
            setDeleteAssign(null);
          }
        }}
      />
    </div>
  );
}