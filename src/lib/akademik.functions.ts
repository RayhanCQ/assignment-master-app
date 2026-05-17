import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const courseInput = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(50),
  semester: z.number().int().min(1).max(20),
});

const assignmentInput = z.object({
  title: z.string().min(1).max(200),
  course_id: z.string().uuid(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["belum", "progress", "selesai"]),
  notes: z.string().max(2000).optional().nullable(),
});

export const listAll = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [coursesRes, assignmentsRes] = await Promise.all([
      supabase.from("courses").select("*").order("name"),
      supabase.from("assignments").select("*").order("deadline"),
    ]);
    if (coursesRes.error) throw new Error(coursesRes.error.message);
    if (assignmentsRes.error) throw new Error(assignmentsRes.error.message);
    return { courses: coursesRes.data ?? [], assignments: assignmentsRes.data ?? [] };
  });

export const seedSampleData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { count } = await supabase
      .from("courses")
      .select("*", { count: "exact", head: true });
    if ((count ?? 0) > 0) return { seeded: false };

    const today = new Date();
    const addDays = (n: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + n);
      return d.toISOString().slice(0, 10);
    };

    const { data: courses, error: cErr } = await supabase
      .from("courses")
      .insert([
        { user_id: userId, name: "Pemrograman Web", code: "TK1234", semester: 4 },
        { user_id: userId, name: "Basis Data", code: "TK2041", semester: 4 },
        { user_id: userId, name: "Interaksi Manusia & Komputer", code: "TK3015", semester: 5 },
      ])
      .select("id, code");
    if (cErr) throw new Error(cErr.message);

    const byCode = Object.fromEntries(courses!.map((c) => [c.code, c.id]));
    const { error: aErr } = await supabase.from("assignments").insert([
      { user_id: userId, course_id: byCode["TK2041"], title: "ERD Project", deadline: addDays(2), status: "belum" },
      { user_id: userId, course_id: byCode["TK2041"], title: "SQL Query Lanjutan", deadline: addDays(7), status: "progress" },
      { user_id: userId, course_id: byCode["TK3015"], title: "UI Prototype", deadline: addDays(5), status: "belum" },
      { user_id: userId, course_id: byCode["TK1234"], title: "Landing Page Tailwind", deadline: addDays(-2), status: "selesai" },
      { user_id: userId, course_id: byCode["TK1234"], title: "Form Validation", deadline: addDays(10), status: "progress" },
    ]);
    if (aErr) throw new Error(aErr.message);
    return { seeded: true };
  });

export const createCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => courseInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("courses")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid() }).merge(courseInput).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("courses").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("courses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => assignmentInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("assignments")
      .insert({ ...data, user_id: userId, notes: data.notes ?? null })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid() }).merge(assignmentInput).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { id, ...patch } = data;
    const { error } = await context.supabase
      .from("assignments")
      .update({ ...patch, notes: patch.notes ?? null })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("assignments").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { profile: data, email: (claims as { email?: string }).email ?? null };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ full_name: z.string().min(1).max(200) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, full_name: data.full_name })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });