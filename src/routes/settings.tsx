import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { db } from "@/lib/store";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Pengaturan — Akademik" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [name, setName] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("user.name") || "Mahasiswa" : "Mahasiswa",
  );
  const [email, setEmail] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("user.email") || "mahasiswa@kampus.ac.id" : "",
  );
  const [reset, setReset] = useState(false);

  function save() {
    localStorage.setItem("user.name", name);
    localStorage.setItem("user.email", email);
    toast.success("Profil disimpan");
  }

  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="container max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground">Atur profil dan data aplikasi.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Profil</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{name}</p>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="n">Nama</Label>
            <Input id="n" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="e">Email</Label>
            <Input id="e" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button onClick={save}>Simpan</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Data Aplikasi</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium">Hapus semua data</p>
            <p className="text-sm text-muted-foreground">Menghapus semua mata kuliah dan assignment secara permanen.</p>
          </div>
          <Button variant="outline" className="text-destructive" onClick={() => setReset(true)}>
            Reset Data
          </Button>
        </CardContent>
      </Card>

      <ConfirmDelete
        open={reset}
        onOpenChange={setReset}
        title="Reset semua data?"
        description="Semua mata kuliah dan assignment akan dihapus permanen. Tindakan ini tidak bisa diurungkan."
        onConfirm={() => {
          db.reset();
          toast.success("Data berhasil di-reset");
          setReset(false);
        }}
      />
    </div>
  );
}