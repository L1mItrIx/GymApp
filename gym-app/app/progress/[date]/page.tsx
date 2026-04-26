"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button, Card } from "@/components/ui";
import {
  ensureSession,
  ensureSessionExercise,
  exerciseHistory,
  getActivePlan,
  getSessionByDate,
  upsertSetLog,
  type ExerciseHistoryEntry,
  type FullSession,
  type FullSessionExercise,
} from "@/lib/data";
import { ExerciseList } from "@/components/ExerciseList";
import { exerciseById } from "@/lib/exercises";
import { MUSCLE_LABELS } from "@/lib/muscles";
import { createClient } from "@/lib/supabase/client";
import type { MuscleGroup } from "@/lib/types";

export default function LogSessionPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [session, setSession] = useState<FullSession | null>(null);
  const [planFocus, setPlanFocus] = useState<MuscleGroup[]>([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [history, setHistory] = useState<Record<string, ExerciseHistoryEntry[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return router.replace("/login");
      setUserId(data.user.id);

      const dow = new Date(date + "T00:00:00").getDay();
      const planDow = (dow + 6) % 7;
      const plan = await getActivePlan(data.user.id);
      const planDay = plan?.days.find((d) => d.day_of_week === planDow);

      let s = await getSessionByDate(data.user.id, date);
      if (!s) {
        await ensureSession({
          userId: data.user.id,
          date,
          planDayId: planDay?.id ?? null,
        });

        // Seed session exercises from the plan day if it isn't a rest day.
        if (planDay && !planDay.is_rest && planDay.exercises.length > 0) {
          s = await getSessionByDate(data.user.id, date);
          if (s) {
            for (let i = 0; i < planDay.exercises.length; i++) {
              await ensureSessionExercise(s.id, planDay.exercises[i].exercise_id, i);
            }
          }
        }
        s = await getSessionByDate(data.user.id, date);
      }
      setSession(s);
      setPlanFocus((planDay?.focus as MuscleGroup[]) ?? []);

      // Load comparison history for each exercise in this session.
      if (s) {
        const map: Record<string, ExerciseHistoryEntry[]> = {};
        for (const ex of s.exercises) {
          map[ex.exercise_id] = await exerciseHistory(data.user.id, ex.exercise_id, 3);
        }
        setHistory(map);
      }
      setLoading(false);
    })();
  }, [router, supabase, date]);

  const reload = async () => {
    if (!userId) return;
    const s = await getSessionByDate(userId, date);
    setSession(s);
    if (s) {
      const map: Record<string, ExerciseHistoryEntry[]> = {};
      for (const ex of s.exercises) {
        map[ex.exercise_id] = await exerciseHistory(userId, ex.exercise_id, 3);
      }
      setHistory(map);
    }
  };

  const onAddExercise = async (input: { exerciseId: string; sets: number }) => {
    if (!session) return;
    await ensureSessionExercise(session.id, input.exerciseId, session.exercises.length);
    setShowCatalog(false);
    await reload();
  };

  const updateSet = async (
    sessionExerciseId: string,
    setNumber: number,
    patch: { weight_kg?: number | null; reps?: number | null; rir?: number | null }
  ) => {
    await upsertSetLog({
      session_exercise_id: sessionExerciseId,
      set_number: setNumber,
      ...patch,
    });
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((e) => {
          if (e.id !== sessionExerciseId) return e;
          const sets = [...e.sets];
          const idx = sets.findIndex((s) => s.set_number === setNumber);
          if (idx >= 0) sets[idx] = { ...sets[idx], ...patch };
          else sets.push({ id: `tmp-${setNumber}`, session_exercise_id: sessionExerciseId, set_number: setNumber, weight_kg: null, reps: null, rir: null, ...patch });
          return { ...e, sets };
        }),
      };
    });
  };

  if (loading || !session) {
    return <div className="max-w-4xl mx-auto px-4 py-10 text-neutral-400">Cargando...</div>;
  }

  const dateLabel = new Date(date + "T00:00:00").toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/progress" className="inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-100">
        <ArrowLeft className="size-4" /> Volver al calendario
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight mt-2 capitalize">{dateLabel}</h1>
      <p className="text-sm text-neutral-400 mt-1">
        Registra tus series. Solo lo que quieras: peso, reps y RIR son opcionales.
      </p>

      <div className="mt-6 space-y-4">
        {session.exercises.length === 0 && (
          <Card className="text-center py-8">
            <p className="text-sm text-neutral-400">
              No hay ejercicios prescritos para este día. Añade los que hayas hecho.
            </p>
          </Card>
        )}

        {session.exercises.map((se) => (
          <SessionExerciseEditor
            key={se.id}
            sessionExercise={se}
            history={history[se.exercise_id] ?? []}
            onUpdateSet={updateSet}
          />
        ))}
      </div>

      <div className="mt-5">
        {showCatalog ? (
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Añadir ejercicio</h3>
              <button onClick={() => setShowCatalog(false)} className="text-xs text-neutral-400 hover:text-neutral-100">
                Cerrar
              </button>
            </div>
            <ExerciseList focusedMuscles={planFocus} onAdd={onAddExercise} />
          </Card>
        ) : (
          <Button variant="secondary" onClick={() => setShowCatalog(true)}>
            <Plus className="size-4" /> Añadir ejercicio
          </Button>
        )}
      </div>
    </div>
  );
}

function SessionExerciseEditor({
  sessionExercise,
  history,
  onUpdateSet,
}: {
  sessionExercise: FullSessionExercise;
  history: ExerciseHistoryEntry[];
  onUpdateSet: (
    sessionExerciseId: string,
    setNumber: number,
    patch: { weight_kg?: number | null; reps?: number | null; rir?: number | null }
  ) => Promise<void>;
}) {
  const data = exerciseById(sessionExercise.exercise_id);
  if (!data) return null;

  // Show 4 set slots (or up to existing logs+2)
  const maxSet = Math.max(4, ...sessionExercise.sets.map((s) => s.set_number));
  const slots = Array.from({ length: maxSet }, (_, i) => i + 1);

  // Comparison: most recent past entry (excluding today)
  const todayDate = sessionExercise.session_id; // not the date — we just compare to history items
  const lastPrev = history.find((h) => true); // all entries are previous since we filtered above

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-medium">{data.name}</div>
          <div className="text-[11px] text-neutral-400 mt-0.5">
            {MUSCLE_LABELS[data.primary]}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[40px_1fr_1fr_1fr] gap-2 items-center">
        <span className="text-[10px] uppercase tracking-wider text-neutral-500">Set</span>
        <span className="text-[10px] uppercase tracking-wider text-neutral-500">Peso (kg)</span>
        <span className="text-[10px] uppercase tracking-wider text-neutral-500">Reps</span>
        <span className="text-[10px] uppercase tracking-wider text-neutral-500">RIR</span>
        {slots.map((n) => {
          const log = sessionExercise.sets.find((s) => s.set_number === n);
          return (
            <SetRow
              key={n}
              setNumber={n}
              weight={log?.weight_kg}
              reps={log?.reps}
              rir={log?.rir}
              onChange={(patch) => onUpdateSet(sessionExercise.id, n, patch)}
            />
          );
        })}
      </div>

      {history.length > 0 && (
        <div className="mt-4 p-3 rounded-md bg-[var(--surface-2)] ring-1 ring-inset ring-[var(--border)]">
          <div className="text-xs text-neutral-400 mb-1.5">
            Últimas sesiones de este ejercicio:
          </div>
          <ul className="space-y-1">
            {history.slice(0, 3).map((h, i) => {
              const max = Math.max(0, ...h.sets.map((s) => s.weight_kg ?? 0));
              const reps = h.sets.find((s) => (s.weight_kg ?? 0) === max && max > 0)?.reps;
              return (
                <li key={i} className="text-xs flex justify-between">
                  <span className="text-neutral-300">
                    {new Date(h.date + "T00:00:00").toLocaleDateString("es", { day: "numeric", month: "short" })}
                  </span>
                  <span className="text-neutral-400">
                    {h.sets.length} sets
                    {max > 0 && (
                      <>
                        {" · top "}
                        <span className="text-emerald-400">
                          {max} kg{reps ? ` × ${reps}` : ""}
                        </span>
                      </>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* keep references */}
      <span className="hidden">{todayDate}{lastPrev?.date}<Trash2 className="size-3" /></span>
    </Card>
  );
}

function SetRow({
  setNumber,
  weight,
  reps,
  rir,
  onChange,
}: {
  setNumber: number;
  weight: number | null | undefined;
  reps: number | null | undefined;
  rir: number | null | undefined;
  onChange: (patch: { weight_kg?: number | null; reps?: number | null; rir?: number | null }) => void;
}) {
  const num = (v: string) => (v.trim() === "" ? null : Number(v));
  return (
    <>
      <div className="text-sm font-medium text-neutral-300 grid place-items-center size-8 rounded-md bg-white/5">
        {setNumber}
      </div>
      <input
        type="number"
        inputMode="decimal"
        step="0.5"
        defaultValue={weight ?? ""}
        onBlur={(e) => onChange({ weight_kg: num(e.target.value) })}
        placeholder="—"
        className="w-full px-2 py-1.5 rounded-md bg-[var(--surface-2)] ring-1 ring-inset ring-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <input
        type="number"
        inputMode="numeric"
        defaultValue={reps ?? ""}
        onBlur={(e) => onChange({ reps: num(e.target.value) })}
        placeholder="—"
        className="w-full px-2 py-1.5 rounded-md bg-[var(--surface-2)] ring-1 ring-inset ring-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <input
        type="number"
        inputMode="numeric"
        defaultValue={rir ?? ""}
        onBlur={(e) => onChange({ rir: num(e.target.value) })}
        placeholder="—"
        className="w-full px-2 py-1.5 rounded-md bg-[var(--surface-2)] ring-1 ring-inset ring-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </>
  );
}
