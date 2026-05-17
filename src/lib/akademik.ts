import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAll } from "./akademik.functions";

export type Course = {
  id: string;
  user_id: string;
  name: string;
  code: string;
  semester: number;
  created_at: string;
  updated_at: string;
};

export type Assignment = {
  id: string;
  user_id: string;
  course_id: string;
  title: string;
  deadline: string;
  status: "belum" | "progress" | "selesai";
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export function useAkademik() {
  const fetcher = useServerFn(listAll);
  return useQuery({
    queryKey: ["akademik"],
    queryFn: () => fetcher(),
    staleTime: 5_000,
  });
}

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