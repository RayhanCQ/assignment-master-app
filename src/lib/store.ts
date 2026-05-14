import { useSyncExternalStore } from "react";

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

const KEY = "akademik.db.v1";

const seed: DB = {
  courses: [
    { id: "c1", name: "Pemrograman Web", code: "TK1234", semester: 4 },
    { id: "c2", name: "Basis Data", code: "TK2041", semester: 4 },
    { id: "c3", name: "Interaksi Manusia & Komputer", code: "TK3015", semester: 5 },
  ],
  assignments: [
    { id: "a1", title: "ERD Project", courseId: "c2", deadline: addDays(2), status: "belum" },
    { id: "a2", title: "SQL Query Lanjutan", courseId: "c2", deadline: addDays(7), status: "progress" },
    { id: "a3", title: "UI Prototype", courseId: "c3", deadline: addDays(5), status: "belum" },
    { id: "a4", title: "Landing Page Tailwind", courseId: "c1", deadline: addDays(-2), status: "selesai" },
    { id: "a5", title: "Form Validation", courseId: "c1", deadline: addDays(10), status: "progress" },
  ],
};

function addDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function load(): DB {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as DB;
  } catch {
    return seed;
  }
}

let state: DB = typeof window === "undefined" ? seed : load();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(state));
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function getSnapshot() {
  return state;
}

export function useDB() {
  return useSyncExternalStore(subscribe, getSnapshot, () => seed);
}

const id = () => Math.random().toString(36).slice(2, 10);

export const db = {
  addCourse(c: Omit<Course, "id">) {
    state = { ...state, courses: [...state.courses, { ...c, id: id() }] };
    persist();
  },
  updateCourse(id: string, patch: Partial<Course>) {
    state = {
      ...state,
      courses: state.courses.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    };
    persist();
  },
  deleteCourse(id: string) {
    state = {
      ...state,
      courses: state.courses.filter((c) => c.id !== id),
      assignments: state.assignments.filter((a) => a.courseId !== id),
    };
    persist();
  },
  addAssignment(a: Omit<Assignment, "id">) {
    state = { ...state, assignments: [...state.assignments, { ...a, id: id() }] };
    persist();
  },
  updateAssignment(id: string, patch: Partial<Assignment>) {
    state = {
      ...state,
      assignments: state.assignments.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    };
    persist();
  },
  deleteAssignment(id: string) {
    state = { ...state, assignments: state.assignments.filter((a) => a.id !== id) };
    persist();
  },
  reset() {
    state = seed;
    persist();
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