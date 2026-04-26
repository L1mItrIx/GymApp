"use client";

import { createClient } from "./supabase/client";
import type {
  PlanDayRow,
  PlanExerciseRow,
  PlanRow,
  ProfileRow,
  SessionExerciseRow,
  SetLogRow,
  WorkoutSessionRow,
} from "./supabase/types";
import type { TemplateDay } from "./templates";

const sb = () => createClient();

// ---------- Profile ----------
export async function getProfile(userId: string): Promise<ProfileRow | null> {
  const { data } = await sb().from("profiles").select("*").eq("id", userId).maybeSingle();
  return data;
}

export async function upsertProfile(row: {
  id: string;
  name: string;
  goal: ProfileRow["goal"];
  experience: ProfileRow["experience"];
  days_per_week: number;
}): Promise<void> {
  const { error } = await sb().from("profiles").upsert(row);
  if (error) throw error;
}

// ---------- Plans ----------
export interface FullPlanDay extends PlanDayRow {
  exercises: PlanExerciseRow[];
}

export interface FullPlan extends PlanRow {
  days: FullPlanDay[];
}

export async function getActivePlan(userId: string): Promise<FullPlan | null> {
  const client = sb();
  const { data: plan } = await client
    .from("plans")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  if (!plan) return null;

  const { data: days } = await client
    .from("plan_days")
    .select("*")
    .eq("plan_id", plan.id)
    .order("day_of_week");

  if (!days) return { ...plan, days: [] };

  const dayIds = days.map((d) => d.id);
  const { data: exercises } = await client
    .from("plan_exercises")
    .select("*")
    .in("plan_day_id", dayIds.length ? dayIds : ["00000000-0000-0000-0000-000000000000"])
    .order("position");

  const byDay = new Map<string, PlanExerciseRow[]>();
  for (const ex of exercises ?? []) {
    const list = byDay.get(ex.plan_day_id) ?? [];
    list.push(ex);
    byDay.set(ex.plan_day_id, list);
  }

  return { ...plan, days: days.map((d) => ({ ...d, exercises: byDay.get(d.id) ?? [] })) };
}

export async function ensurePlan(userId: string): Promise<FullPlan> {
  const existing = await getActivePlan(userId);
  if (existing) return existing;

  const client = sb();

  const { data: planRow, error: planErr } = await client
    .from("plans")
    .insert({ user_id: userId, name: "Mi semana", is_active: true })
    .select()
    .single();
  if (planErr) throw planErr;

  const dayRows = Array.from({ length: 7 }, (_, dow) => ({
    plan_id: planRow.id,
    day_of_week: dow,
    is_rest: true,
    name: null,
    focus: [] as string[],
  }));
  const { error: daysErr } = await client.from("plan_days").insert(dayRows);
  if (daysErr) throw daysErr;

  const plan = await getActivePlan(userId);
  if (!plan) throw new Error("No se pudo crear el plan");
  return plan;
}

export async function updatePlanDay(
  dayId: string,
  patch: { is_rest?: boolean; name?: string | null; focus?: string[] }
): Promise<void> {
  const { error } = await sb().from("plan_days").update(patch).eq("id", dayId);
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
  const { data, error } = await sb().from("plan_exercises").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updatePlanExercise(
  id: string,
  patch: { sets?: number; reps?: string; rir?: number | null; notes?: string | null; position?: number }
): Promise<void> {
  const { error } = await sb().from("plan_exercises").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deletePlanExercise(id: string): Promise<void> {
  const { error } = await sb().from("plan_exercises").delete().eq("id", id);
  if (error) throw error;
}

export async function clearPlanDay(dayId: string): Promise<void> {
  const { error } = await sb().from("plan_exercises").delete().eq("plan_day_id", dayId);
  if (error) throw error;
}

export async function applyTemplateToPlan(planId: string, days: TemplateDay[]): Promise<void> {
  const client = sb();

  const { data: existingDays, error: dErr } = await client
    .from("plan_days")
    .select("id, day_of_week")
    .eq("plan_id", planId);
  if (dErr) throw dErr;

  const dayIdByDow = new Map<number, string>();
  for (const d of existingDays ?? []) dayIdByDow.set(d.day_of_week, d.id);

  for (const tplDay of days) {
    const dayId = dayIdByDow.get(tplDay.dayOfWeek);
    if (!dayId) continue;

    await client
      .from("plan_days")
      .update({
        is_rest: tplDay.isRest,
        name: tplDay.name,
        focus: tplDay.focus,
      })
      .eq("id", dayId);

    await client.from("plan_exercises").delete().eq("plan_day_id", dayId);

    if (tplDay.exercises.length) {
      await client.from("plan_exercises").insert(
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
  const client = sb();
  const { data: session } = await client
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();
  if (!session) return null;

  const { data: exercises } = await client
    .from("session_exercises")
    .select("*")
    .eq("session_id", session.id)
    .order("position");

  const exerciseIds = (exercises ?? []).map((e) => e.id);
  const { data: sets } = await client
    .from("set_logs")
    .select("*")
    .in("session_exercise_id", exerciseIds.length ? exerciseIds : ["00000000-0000-0000-0000-000000000000"])
    .order("set_number");

  const setsByEx = new Map<string, SetLogRow[]>();
  for (const s of sets ?? []) {
    const list = setsByEx.get(s.session_exercise_id) ?? [];
    list.push(s);
    setsByEx.set(s.session_exercise_id, list);
  }

  return {
    ...session,
    exercises: (exercises ?? []).map((e) => ({ ...e, sets: setsByEx.get(e.id) ?? [] })),
  };
}

export async function ensureSession(input: {
  userId: string;
  date: string;
  planDayId?: string | null;
}): Promise<WorkoutSessionRow> {
  const client = sb();
  const existing = await client
    .from("workout_sessions")
    .select("*")
    .eq("user_id", input.userId)
    .eq("date", input.date)
    .maybeSingle();
  if (existing.data) return existing.data;
  const { data, error } = await client
    .from("workout_sessions")
    .insert({ user_id: input.userId, date: input.date, plan_day_id: input.planDayId ?? null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function ensureSessionExercise(
  sessionId: string,
  exerciseId: string,
  position: number
): Promise<SessionExerciseRow> {
  const client = sb();
  const existing = await client
    .from("session_exercises")
    .select("*")
    .eq("session_id", sessionId)
    .eq("exercise_id", exerciseId)
    .maybeSingle();
  if (existing.data) return existing.data;
  const { data, error } = await client
    .from("session_exercises")
    .insert({ session_id: sessionId, exercise_id: exerciseId, position })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function upsertSetLog(input: {
  session_exercise_id: string;
  set_number: number;
  weight_kg?: number | null;
  reps?: number | null;
  rir?: number | null;
}): Promise<void> {
  const client = sb();
  const existing = await client
    .from("set_logs")
    .select("id")
    .eq("session_exercise_id", input.session_exercise_id)
    .eq("set_number", input.set_number)
    .maybeSingle();
  if (existing.data) {
    const { error } = await client
      .from("set_logs")
      .update({
        weight_kg: input.weight_kg ?? null,
        reps: input.reps ?? null,
        rir: input.rir ?? null,
      })
      .eq("id", existing.data.id);
    if (error) throw error;
  } else {
    const { error } = await client.from("set_logs").insert({
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
  const { data } = await sb()
    .from("workout_sessions")
    .select("date")
    .eq("user_id", userId)
    .gte("date", fromDate)
    .lte("date", toDate)
    .order("date");
  return (data ?? []).map((d) => d.date);
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
  const client = sb();
  const { data: sessions } = await client
    .from("workout_sessions")
    .select("id, date")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(50);
  if (!sessions || sessions.length === 0) return [];

  const sessionIds = sessions.map((s) => s.id);
  const { data: ses } = await client
    .from("session_exercises")
    .select("id, session_id, exercise_id")
    .in("session_id", sessionIds)
    .eq("exercise_id", exerciseId);

  if (!ses || ses.length === 0) return [];

  const sesIds = ses.map((s) => s.id);
  const { data: sets } = await client
    .from("set_logs")
    .select("*")
    .in("session_exercise_id", sesIds)
    .order("set_number");

  const setsBySes = new Map<string, SetLogRow[]>();
  for (const s of sets ?? []) {
    const list = setsBySes.get(s.session_exercise_id) ?? [];
    list.push(s);
    setsBySes.set(s.session_exercise_id, list);
  }

  const dateById = new Map(sessions.map((s) => [s.id, s.date]));

  return ses
    .map((s) => ({ date: dateById.get(s.session_id)!, sets: setsBySes.get(s.id) ?? [] }))
    .filter((e) => e.sets.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}
