import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { db, useDB, type Assignment } from "@/lib/store";
import { toast } from "sonner";

export function AssignmentDialog({
  open,
  onOpenChange,
  initial,
  defaultCourseId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Assignment | null;
  defaultCourseId?: string;
}) {
  const { courses } = useDB();
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState<Assignment["status"]>("belum");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setCourseId(initial?.courseId ?? defaultCourseId ?? courses[0]?.id ?? "");
      setDeadline(initial?.deadline ?? new Date().toISOString().slice(0, 10));
      setStatus(initial?.status ?? "belum");
      setNotes(initial?.notes ?? "");
    }
  }, [open, initial, defaultCourseId, courses]);

  const isEdit = Boolean(initial);
  const valid = title.trim().length > 0 && courseId && deadline;

  function submit() {
    if (!valid) return;
    const payload = { title: title.trim(), courseId, deadline, status, notes: notes.trim() };
    if (isEdit && initial) {
      db.updateAssignment(initial.id, payload);
      toast.success("Assignment diperbarui");
    } else {
      db.addAssignment(payload);
      toast.success("Assignment ditambahkan");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Assignment" : "Tambah Assignment"}</DialogTitle>
          <DialogDescription>Catat tugas baru beserta deadline-nya.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="title">Nama Tugas</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="cth. ERD Project" />
          </div>
          <div className="grid gap-2">
            <Label>Mata Kuliah</Label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih mata kuliah" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Assignment["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="belum">Belum</SelectItem>
                  <SelectItem value="progress">Progress</SelectItem>
                  <SelectItem value="selesai">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Catatan (opsional)</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={submit} disabled={!valid}>{isEdit ? "Simpan" : "Tambah"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}