import { supabase } from "./supabase";
import type { TemplateDay } from "./templates";

// Row types (mirror Supabase schema)
export interface ProfileRow {
  id: string;
  name: string;
  goal: "hypertrophy" | "strength" | "weight_loss" | "endurance" | "general_fitness";
  experience: "beginner" | "intermediate" | "advanced";
  days_per_week: number;
  created_at: string;
  updated_at: string;
}

export interface PlanRow {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanDayRow {
  id: string;
  plan_id: string;
  day_of_week: number;
  is_rest: boolean;
  name: string | null;
  focus: string[];
}

export interface PlanExerciseRow {
  id: string;
  plan_day_id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  rir: number | null;
  notes: string | null;
  position: number;
}

export interface WorkoutSessionRow {
  id: string;
  user_id: string;
  date: string;
  plan_day_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface SessionExerciseRow {
  id: string;
  session_id: string;
  exercise_id: string;
  position: number;
}

export interface SetLogRow {
  id: string;
  session_exercise_id: string;
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
  rir: number | null;
}

export interface FullPlanDay extends PlanDayRow {
  exercises: PlanExerciseRow[];
}

export interface FullPlan extends PlanRow {
  days: FullPlanDay[];
}

// ---------- Profile ----------
export async function getProfile(userId: string): Promise<ProfileRow | null> {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data as ProfileRow | null;
}

export async function upsertProfile(row: {
  id: string;
  name: string;
  goal: ProfileRow["goal"];
  experience: ProfileRow["experience"];
  days_per_week: number;
}): Promise<void> {
  const { error } = await supabase.from("profiles").upsert(row);
  if (error) throw error;
}

// ---------- Plans ----------
export async function getActivePlan(userId: string): Promise<FullPlan | null> {
  const { data: plan } = await supabase
    .from("plans")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  if (!plan) return null;

  const { data: days } = await supabase
    .from("plan_days")
    .select("*")
    .eq("plan_id", plan.id)
    .order("day_of_week");

  if (!days) return { ...(plan as PlanRow), days: [] };

  const dayIds = days.map((d: PlanDayRow) => d.id);
  const { data: exercises } = await supabase
    .from("plan_exercises")
    .select("*")
    .in("plan_day_id", dayIds.length ? dayIds : ["00000000-0000-0000-0000-000000000000"])
    .order("position");

  const byDay = new Map<string, PlanExerciseRow[]>();
  for (const ex of (exercises ?? []) as PlanExerciseRow[]) {
    const list = byDay.get(ex.plan_day_id) ?? [];
    list.push(ex);
    byDay.set(ex.plan_day_id, list);
  }

  return {
    ...(plan as PlanRow),
    days: (days as PlanDayRow[]).map((d) => ({ ...d, exercises: byDay.get(d.id) ?? [] })),
  };
}

export async function ensurePlan(userId: string): Promise<FullPlan> {
  const existing = await getActivePlan(userId);
  if (existing) return existing;

  const { data: planRow, error: planErr } = await supabase
    .from("plans")
    .insert({ user_id: userId, name: "Mi semana", is_active: true })
    .select()
    .single();
  if (planErr) throw planErr;

  const dayRows = Array.from({ length: 7 }, (_, dow) => ({
    plan_id: (planRow as PlanRow).id,
    day_of_week: dow,
    is_rest: true,
    name: null,
    focus: [] as string[],
  }));
  const { error: daysErr } = await supabase.from("plan_days").insert(dayRows);
  if (daysErr) throw daysErr;

  const plan = await getActivePlan(userId);
  if (!plan) throw new Error("No se pudo crear el plan");
  return plan;
}

export async function updatePlanDay(
  dayId: string,
  patch: { is_rest?: boolean; name?: string | null; focus?: string[] }
): Promise<void> {
  const { error } = await supabase.from("plan_days").update(patch).eq("id", dayId);
  if (error) throw error;
}

export async function addPlanExercise(input: {
  plan_day_id: string;
  exercise_id: string;
  sets?: number;
  reps?: string;
  rir?: number;
  position?: number;
}): Promise<PlanExerciseRow> {
  const { data, error } = await supabase.from("plan_exercises").insert(input).select().single();
  if (error) throw error;
  return data as PlanExerciseRow;
}

export async function updatePlanExercise(
  id: string,
  patch: { sets?: number; reps?: string; rir?: number | null; notes?: string | null; position?: number }
): Promise<void> {
  const { error } = await supabase.from("plan_exercises").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deletePlanExercise(id: string): Promise<void> {
  const { error } = await supabase.from("plan_exercises").delete().eq("id", id);
  if (error) throw error;
}

export async function clearPlanDay(dayId: string): Promise<void> {
  const { error } = await supabase.from("plan_exercises").delete().eq("plan_day_id", dayId);
  if (error) throw error;
}

export async function applyTemplateToPlan(planId: string, days: TemplateDay[]): Promise<void> {
  const { data: existingDays, error: dErr } = await supabase
    .from("plan_days")
    .select("id, day_of_week")
    .eq("plan_id", planId);
  if (dErr) throw dErr;

  const dayIdByDow = new Map<number, string>();
  for (const d of (existingDays ?? []) as { id: string; day_of_week: number }[]) {
    dayIdByDow.set(d.day_of_week, d.id);
  }

  for (const tplDay of days) {
    const dayId = dayIdByDow.get(tplDay.dayOfWeek);
    if (!dayId) continue;

    await supabase
      .from("plan_days")
      .update({
        is_rest: tplDay.isRest,
        name: tplDay.name,
        focus: tplDay.focus,
      })
      .eq("id", dayId);

    await supabase.from("plan_exercises").delete().eq("plan_day_id", dayId);

    if (tplDay.exercises.length) {
      await supabase.from("plan_exercises").insert(
        tplDay.exercises.map((e, i) => ({
          plan_day_id: dayId,
          exercise_id: e.exerciseId,
          sets: e.sets,
          reps: e.reps,
          rir: e.rir ?? null,
          position: i,
        }))
      );
    }
  }
}

// ---------- Sessions / logging ----------
export interface FullSessionExercise extends SessionExerciseRow {
  sets: SetLogRow[];
}

export interface FullSession extends WorkoutSessionRow {
  exercises: FullSessionExercise[];
}

export async function getSessionByDate(userId: string, date: string): Promise<FullSession | null> {
  const { data: session } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();
  if (!session) return null;

  const { data: exercises } = await supabase
    .from("session_exercises")
    .select("*")
    .eq("session_id", (session as WorkoutSessionRow).id)
    .order("position");

  const exerciseIds = ((exercises ?? []) as SessionExerciseRow[]).map((e) => e.id);
  const { data: sets } = await supabase
    .from("set_logs")
    .select("*")
    .in("session_exercise_id", exerciseIds.length ? exerciseIds : ["00000000-0000-0000-0000-000000000000"])
    .order("set_number");

  const setsByEx = new Map<string, SetLogRow[]>();
  for (const s of (sets ?? []) as SetLogRow[]) {
    const list = setsByEx.get(s.session_exercise_id) ?? [];
    list.push(s);
    setsByEx.set(s.session_exercise_id, list);
  }

  return {
    ...(session as WorkoutSessionRow),
    exercises: ((exercises ?? []) as SessionExerciseRow[]).map((e) => ({
      ...e,
      sets: setsByEx.get(e.id) ?? [],
    })),
  };
}

export async function ensureSession(input: {
  userId: string;
  date: string;
  planDayId?: string | null;
}): Promise<WorkoutSessionRow> {
  const existing = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", input.userId)
    .eq("date", input.date)
    .maybeSingle();
  if (existing.data) return existing.data as WorkoutSessionRow;
  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({ user_id: input.userId, date: input.date, plan_day_id: input.planDayId ?? null })
    .select()
    .single();
  if (error) throw error;
  return data as WorkoutSessionRow;
}

export async function ensureSessionExercise(
  sessionId: string,
  exerciseId: string,
  position: number
): Promise<SessionExerciseRow> {
  const existing = await supabase
    .from("session_exercises")
    .select("*")
    .eq("session_id", sessionId)
    .eq("exercise_id", exerciseId)
    .maybeSingle();
  if (existing.data) return existing.data as SessionExerciseRow;
  const { data, error } = await supabase
    .from("session_exercises")
    .insert({ session_id: sessionId, exercise_id: exerciseId, position })
    .select()
    .single();
  if (error) throw error;
  return data as SessionExerciseRow;
}

export async function upsertSetLog(input: {
  session_exercise_id: string;
  set_number: number;
  weight_kg?: number | null;
  reps?: number | null;
  rir?: number | null;
}): Promise<void> {
  const existing = await supabase
    .from("set_logs")
    .select("id")
    .eq("session_exercise_id", input.session_exercise_id)
    .eq("set_number", input.set_number)
    .maybeSingle();
  if (existing.data) {
    const { error } = await supabase
      .from("set_logs")
      .update({
        weight_kg: input.weight_kg ?? null,
        reps: input.reps ?? null,
        rir: input.rir ?? null,
      })
      .eq("id", (existing.data as { id: string }).id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("set_logs").insert({
      session_exercise_id: input.session_exercise_id,
      set_number: input.set_number,
      weight_kg: input.weight_kg ?? null,
      reps: input.reps ?? null,
      rir: input.rir ?? null,
    });
    if (error) throw error;
  }
}

export async function listSessionDates(userId: string, fromDate: string, toDate: string): Promise<string[]> {
  const { data } = await supabase
    .from("workout_sessions")
    .select("date")
    .eq("user_id", userId)
    .gte("date", fromDate)
    .lte("date", toDate)
    .order("date");
  return ((data ?? []) as { date: string }[]).map((d) => d.date);
}

export interface ExerciseHistoryEntry {
  date: string;
  sets: SetLogRow[];
}

export async function exerciseHistory(
  userId: string,
  exerciseId: string,
  limit = 5
): Promise<ExerciseHistoryEntry[]> {
  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, date")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(50);
  if (!sessions || sessions.length === 0) return [];

  const sessionIds = (sessions as { id: string; date: string }[]).map((s) => s.id);
  const { data: ses } = await supabase
    .from("session_exercises")
    .select("id, session_id, exercise_id")
    .in("session_id", sessionIds)
    .eq("exercise_id", exerciseId);

  if (!ses || ses.length === 0) return [];

  const sesIds = (ses as SessionExerciseRow[]).map((s) => s.id);
  const { data: sets } = await supabase
    .from("set_logs")
    .select("*")
    .in("session_exercise_id", sesIds)
    .order("set_number");

  const setsBySes = new Map<string, SetLogRow[]>();
  for (const s of (sets ?? []) as SetLogRow[]) {
    const list = setsBySes.get(s.session_exercise_id) ?? [];
    list.push(s);
    setsBySes.set(s.session_exercise_id, list);
  }

  const dateById = new Map((sessions as { id: string; date: string }[]).map((s) => [s.id, s.date]));

  return (ses as SessionExerciseRow[])
    .map((s) => ({ date: dateById.get(s.session_id)!, sets: setsBySes.get(s.id) ?? [] }))
    .filter((e) => e.sets.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}
