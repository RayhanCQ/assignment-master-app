import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Course = {
  id: string;
  name: string;
  code: string;
  semester: number;
};

export type Assignment = {
  id: string;
  title: string;
  courseId: string;
  deadline: string; // ISO date
  status: "belum" | "progress" | "selesai";
  notes?: string;
};

type DB = { courses: Course[]; assignments: Assignment[] };

const empty: DB = { courses: [], assignments: [] };

function addDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

let state: DB = empty;
let loaded = false;
let loading = false;
const listeners = new Set<() => void>();

function notify() { listeners.forEach((l) => l()); }

async function refresh() {
  const [c, a] = await Promise.all([
    supabase.from("courses").select("*").order("name"),
    supabase.from("assignments").select("*").order("deadline"),
  ]);
  state = {
    courses: (c.data ?? []).map((r: any) => ({ id: r.id, name: r.name, code: r.code, semester: r.semester })),
    assignments: (a.data ?? []).map((r: any) => ({
      id: r.id, title: r.title, courseId: r.course_id, deadline: r.deadline,
      status: r.status, notes: r.notes ?? undefined,
    })),
  };
  loaded = true;
  notify();
}

async function ensureLoaded() {
  if (loaded || loading) return;
  loading = true;
  try { await refresh(); } finally { loading = false; }
}

async function seedIfEmpty(userId: string) {
  const { count } = await supabase.from("courses").select("*", { count: "exact", head: true });
  if ((count ?? 0) > 0) return;
  const { data: cs } = await supabase.from("courses").insert([
    { user_id: userId, name: "Pemrograman Web", code: "TK1234", semester: 4 },
    { user_id: userId, name: "Basis Data", code: "TK2041", semester: 4 },
    { user_id: userId, name: "Interaksi Manusia & Komputer", code: "TK3015", semester: 5 },
  ]).select("id, code");
  if (!cs) return;
  const byCode = Object.fromEntries(cs.map((c: any) => [c.code, c.id]));
  await supabase.from("assignments").insert([
    { user_id: userId, course_id: byCode["TK2041"], title: "ERD Project", deadline: addDays(2), status: "belum" },
    { user_id: userId, course_id: byCode["TK2041"], title: "SQL Query Lanjutan", deadline: addDays(7), status: "progress" },
    { user_id: userId, course_id: byCode["TK3015"], title: "UI Prototype", deadline: addDays(5), status: "belum" },
    { user_id: userId, course_id: byCode["TK1234"], title: "Landing Page Tailwind", deadline: addDays(-2), status: "selesai" },
    { user_id: userId, course_id: byCode["TK1234"], title: "Form Validation", deadline: addDays(10), status: "progress" },
  ]);
}

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange(async (_e, session) => {
    if (session?.user) {
      await seedIfEmpty(session.user.id);
      await refresh();
    } else {
      state = empty; loaded = false; notify();
    }
  });
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function getSnapshot() {
  return state;
}

export function useDB() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, () => empty);
  useEffect(() => { ensureLoaded(); }, []);
  return snap;
}

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Tidak terautentikasi");
  return data.user.id;
}

export const db = {
  async addCourse(c: Omit<Course, "id">) {
    const user_id = await currentUserId();
    const { error } = await supabase.from("courses").insert({ ...c, user_id });
    if (error) throw error;
    await refresh();
  },
  async updateCourse(id: string, patch: Partial<Course>) {
    const { error } = await supabase.from("courses").update(patch).eq("id", id);
    if (error) throw error;
    await refresh();
  },
  async deleteCourse(id: string) {
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) throw error;
    await refresh();
  },
  async addAssignment(a: Omit<Assignment, "id">) {
    const user_id = await currentUserId();
    const { error } = await supabase.from("assignments").insert({
      user_id, course_id: a.courseId, title: a.title, deadline: a.deadline,
      status: a.status, notes: a.notes ?? null,
    });
    if (error) throw error;
    await refresh();
  },
  async updateAssignment(id: string, patch: Partial<Assignment>) {
    const dbPatch: any = { ...patch };
    if (patch.courseId !== undefined) { dbPatch.course_id = patch.courseId; delete dbPatch.courseId; }
    if (patch.notes !== undefined) dbPatch.notes = patch.notes ?? null;
    const { error } = await supabase.from("assignments").update(dbPatch).eq("id", id);
    if (error) throw error;
    await refresh();
  },
  async deleteAssignment(id: string) {
    const { error } = await supabase.from("assignments").delete().eq("id", id);
    if (error) throw error;
    await refresh();
  },
  async reset() {
    const user_id = await currentUserId();
    await supabase.from("assignments").delete().eq("user_id", user_id);
    await supabase.from("courses").delete().eq("user_id", user_id);
    await refresh();
  },
};

export function daysUntil(dateStr: string) {
  const target = new Date(dateStr + "T23:59:59").getTime();
  const now = Date.now();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}