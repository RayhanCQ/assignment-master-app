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
import { db, type Course } from "@/lib/store";
import { toast } from "sonner";

export function CourseDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Course | null;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [semester, setSemester] = useState("1");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setCode(initial?.code ?? "");
      setSemester(String(initial?.semester ?? 1));
    }
  }, [open, initial]);

  const isEdit = Boolean(initial);
  const sem = Number(semester);
  const valid = name.trim().length > 0 && code.trim().length > 0 && sem >= 1 && sem <= 14;

  function submit() {
    if (!valid) return;
    if (isEdit && initial) {
      db.updateCourse(initial.id, { name: name.trim(), code: code.trim(), semester: sem });
      toast.success("Mata kuliah diperbarui");
    } else {
      db.addCourse({ name: name.trim(), code: code.trim(), semester: sem });
      toast.success("Mata kuliah ditambahkan");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Mata Kuliah" : "Tambah Mata Kuliah"}</DialogTitle>
          <DialogDescription>
            Lengkapi informasi mata kuliah di bawah ini.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Nama Mata Kuliah</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="cth. Basis Data" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="code">Kode</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="TK2041" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sem">Semester</Label>
              <Input id="sem" type="number" min={1} max={14} value={semester} onChange={(e) => setSemester(e.target.value)} />
            </div>
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