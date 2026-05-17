## Tujuan

Mengubah aplikasi Akademik dari prototype berbasis localStorage menjadi aplikasi full-stack yang fungsional dengan database asli, autentikasi user, dan CRUD multi-user yang aman.

## Yang Akan Dibangun

### 1. Aktivasi Lovable Cloud
Mengaktifkan backend terkelola (Postgres + Auth + Storage) tanpa setup eksternal. Ini menggantikan `localStorage` sebagai sumber data.

### 2. Database Schema
Tiga tabel utama di Postgres dengan Row-Level Security (RLS) sehingga setiap user hanya melihat data miliknya sendiri.

```text
profiles
  id (uuid, FK -> auth.users)
  full_name (text)
  created_at, updated_at

courses
  id (uuid, PK)
  user_id (uuid, FK -> auth.users)  ← scope per-user
  name (text)
  code (text)
  semester (int)
  created_at, updated_at

assignments
  id (uuid, PK)
  user_id (uuid, FK -> auth.users)  ← scope per-user
  course_id (uuid, FK -> courses ON DELETE CASCADE)
  title (text)
  deadline (date)
  status (enum: belum | progress | selesai)
  notes (text, nullable)
  created_at, updated_at
```

RLS policies: setiap user hanya bisa SELECT/INSERT/UPDATE/DELETE row yang `user_id = auth.uid()`. Profile auto-dibuat lewat trigger saat signup.

### 3. Autentikasi
- Halaman `/login` dan `/signup` dengan **email + password** dan **Sign in with Google**.
- Layout terproteksi `_authenticated` — semua halaman aplikasi (Dashboard, Courses, Assignments, Settings) ada di bawahnya dan redirect ke `/login` jika belum login.
- Tombol logout di sidebar.
- Listener `onAuthStateChange` di root untuk invalidate cache saat login/logout.

### 4. Migrasi Data Layer
Mengganti `src/lib/store.ts` (localStorage + `useSyncExternalStore`) dengan:
- **Server functions** (`createServerFn` + `requireSupabaseAuth`) untuk semua CRUD — query Postgres dengan RLS sebagai user yang login.
- **TanStack Query** (`useQuery` / `useMutation`) di komponen untuk caching, loading state, dan refetch otomatis.
- File baru: `src/lib/courses.functions.ts`, `src/lib/assignments.functions.ts`, `src/lib/profile.functions.ts`.

### 5. Update Halaman yang Sudah Ada
Semua halaman dirombak agar pakai server functions + React Query (tetap dengan UI/UX yang sama):
- Dashboard — statistik & deadline mendekat dari DB.
- Courses (list/detail/create/edit/delete).
- Assignments (list/create/edit/delete + filter).
- Settings — edit profile asli (bukan localStorage), tombol logout.

### 6. Seed Data Opsional
Saat user pertama kali signup, otomatis di-seed 3 mata kuliah + beberapa assignment contoh supaya dashboard tidak kosong (lewat server function yang dipanggil sekali jika courses user kosong).

## Yang TIDAK Berubah

- Desain visual, palet warna, layout sidebar, komponen UI shadcn.
- Tech stack: tetap TanStack Start + React + Tailwind.
- Deploy: tetap di Lovable hosting (Cloudflare Workers).

## Pertanyaan Klarifikasi

1. **Metode login**: default saya pakai **Email/Password + Google**. Mau begitu, atau email/password saja?
2. **Profile**: butuh field tambahan (NIM, jurusan, foto avatar) atau cukup nama saja?
3. **Seed data**: auto-seed contoh saat signup pertama, atau mulai dari kosong?

Setelah dijawab, saya akan implementasi end-to-end dalam satu pass.