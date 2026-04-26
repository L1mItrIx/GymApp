"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { OptimizationPanel } from "@/components/OptimizationPanel";
import {
  addPlanExercise,
  clearPlanDay,
  deletePlanExercise,
  ensurePlan,
  type FullPlan,
  updatePlanDay,
  updatePlanExercise,
} from "@/lib/data";
import { exerciseById } from "@/lib/exercises";
import { MUSCLE_LABELS } from "@/lib/muscles";
import { analyzePlan, type PlanDayInput } from "@/lib/optimization";
import { createClient } from "@/lib/supabase/client";
import type { MuscleGroup } from "@/lib/types";
import { MuscleSelector } from "@/components/MuscleSelector";
import { ExerciseList } from "@/components/ExerciseList";
import { Coffee, Dumbbell, Trash2 } from "lucide-react";

const DAY_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function AgendaPage() {
  const router = useRouter();
  const supabase = createClient();
  const [plan, setPlan] = useState<FullPlan | null>(null);
  const [activeDow, setActiveDow] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return router.replace("/login");
      const p = await ensurePlan(data.user.id);
      setPlan(p);
      setLoading(false);
    })();
  }, [router, supabase]);

  const refresh = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const p = await ensurePlan(data.user.id);
    setPlan(p);
  };

  const report = useMemo(() => {
    if (!plan) return null;
    const input: PlanDayInput[] = plan.days.map((d) => ({
      dayOfWeek: d.day_of_week,
      isRest: d.is_rest,
      exercises: d.exercises.map((e) => ({ exerciseId: e.exercise_id, sets: e.sets })),
    }));
    return analyzePlan(input);
  }, [plan]);

  if (loading || !plan) {
    return <div className="max-w-7xl mx-auto px-4 py-10 text-neutral-400">Cargando agenda...</div>;
  }

  const day = plan.days.find((d) => d.day_of_week === activeDow)!;

  const toggleRest = async () => {
    await updatePlanDay(day.id, { is_rest: !day.is_rest });
    if (!day.is_rest) await clearPlanDay(day.id);
    await refresh();
  };

  const setName = async (name: string) => {
    await updatePlanDay(day.id, { name: name || null });
    setPlan((prev) => prev && {
      ...prev,
      days: prev.days.map((d) => (d.id === day.id ? { ...d, name: name || null } : d)),
    });
  };

  const setFocus = async (focus: MuscleGroup[]) => {
    await updatePlanDay(day.id, { focus });
    setPlan((prev) => prev && {
      ...prev,
      days: prev.days.map((d) => (d.id === day.id ? { ...d, focus } : d)),
    });
  };

  const onAddExercise = async (input: { exerciseId: string; sets: number; reps: string; rir?: number }) => {
    await addPlanExercise({
      plan_day_id: day.id,
      exercise_id: input.exerciseId,
      sets: input.sets,
      reps: input.reps,
      rir: input.rir,
      position: day.exercises.length,
    });
    await refresh();
  };

  const onUpdateExercise = async (id: string, patch: { sets?: number; reps?: string; rir?: number | null }) => {
    await updatePlanExercise(id, patch);
    setPlan((prev) =>
      prev && {
        ...prev,
        days: prev.days.map((d) =>
          d.id === day.id
            ? { ...d, exercises: d.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)) }
            : d
        ),
      }
    );
  };

  const onRemoveExercise = async (id: string) => {
    await deletePlanExercise(id);
    setPlan((prev) =>
      prev && {
        ...prev,
        days: prev.days.map((d) =>
          d.id === day.id ? { ...d, exercises: d.exercises.filter((e) => e.id !== id) } : d
        ),
      }
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Mi agenda semanal</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Tu rutina persistente. Edita cada día, marca descansos, mantenla durante semanas.
          </p>
        </div>
        <Link href="/routines">
          <Button variant="secondary">Cargar rutina</Button>
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-5">
        {plan.days.map((d, i) => {
          const isActive = activeDow === i;
          const sets = d.exercises.reduce((a, e) => a + e.sets, 0);
          return (
            <button
              key={d.id}
              onClick={() => setActiveDow(i)}
              className={[
                "p-2 rounded-md ring-1 ring-inset transition text-left",
                isActive ? "bg-indigo-500/15 ring-indigo-500/40" : "bg-[var(--surface)] ring-[var(--border)] hover:ring-white/20",
              ].join(" ")}
            >
              <div className="text-[10px] uppercase tracking-wider text-neutral-400">
                {DAY_LABELS[i].slice(0, 3)}
              </div>
              {d.is_rest ? (
                <div className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
                  <Coffee className="size-3.5" /> Descanso
                </div>
              ) : (
                <>
                  <div className="mt-1 text-xs font-medium text-neutral-100 truncate">
                    {d.name ?? "Entreno"}
                  </div>
                  <div className="mt-0.5 text-[10px] text-neutral-500">{sets} series</div>
                </>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-5">
        <div className="space-y-5">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">{DAY_LABELS[activeDow]}</h2>
              <button
                onClick={toggleRest}
                className={[
                  "px-3 py-1.5 text-xs rounded-md ring-1 ring-inset",
                  day.is_rest
                    ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30"
                    : "bg-white/5 text-neutral-300 ring-[var(--border)] hover:ring-white/20",
                ].join(" ")}
              >
                {day.is_rest ? "Día de descanso (cambiar a entreno)" : "Marcar como descanso"}
              </button>
            </div>

            {!day.is_rest && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Nombre del día
                  </label>
                  <input
                    type="text"
                    value={day.name ?? ""}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Push, Pull, Pierna, Full Body"
                    className="w-full px-3 py-2 rounded-md bg-[var(--surface-2)] ring-1 ring-inset ring-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-neutral-400">Músculos enfocados</span>
                    <span className="text-[11px] text-neutral-500">
                      {day.focus.length === 0 ? "Sin selección" : `${day.focus.length} sel.`}
                    </span>
                  </div>
                  <MuscleSelector
                    value={day.focus as MuscleGroup[]}
                    onChange={(focus) => setFocus(focus)}
                  />
                </div>
              </div>
            )}
          </Card>

          {!day.is_rest && (
            <div className="grid lg:grid-cols-2 gap-5">
              <Card>
                <h3 className="font-medium mb-3">Ejercicios del día</h3>
                {day.exercises.length === 0 ? (
                  <p className="text-sm text-neutral-500 italic p-4 text-center rounded-md border border-dashed border-[var(--border)]">
                    Aún no añadiste ejercicios.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {day.exercises.map((ex) => {
                      const data = exerciseById(ex.exercise_id);
                      if (!data) return null;
                      return (
                        <li key={ex.id} className="rounded-md p-3 bg-[var(--surface-2)] ring-1 ring-inset ring-[var(--border)]">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{data.name}</div>
                              <div className="text-[11px] text-neutral-400">
                                {MUSCLE_LABELS[data.primary]}
                              </div>
                            </div>
                            <button
                              onClick={() => onRemoveExercise(ex.id)}
                              className="p-1 text-neutral-500 hover:text-red-400"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-2">
                            <NumField
                              label="Series"
                              value={ex.sets}
                              min={1}
                              max={12}
                              onChange={(v) => onUpdateExercise(ex.id, { sets: v })}
                            />
                            <TextField
                              label="Reps"
                              value={ex.reps}
                              onChange={(v) => onUpdateExercise(ex.id, { reps: v })}
                            />
                            <NumField
                              label="RIR"
                              value={ex.rir ?? 0}
                              min={0}
                              max={6}
                              onChange={(v) => onUpdateExercise(ex.id, { rir: v })}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>

              <Card>
                <h3 className="font-medium mb-3">Añadir ejercicios</h3>
                <ExerciseList
                  focusedMuscles={day.focus as MuscleGroup[]}
                  onAdd={(input) => onAddExercise(input as { exerciseId: string; sets: number; reps: string; rir?: number })}
                />
              </Card>
            </div>
          )}

          {day.is_rest && (
            <Card className="text-center py-10">
              <Dumbbell className="size-8 text-neutral-500 mx-auto" />
              <p className="mt-3 text-neutral-400">
                Este día está marcado como descanso. Cambia a entreno para añadir ejercicios.
              </p>
            </Card>
          )}
        </div>

        <aside className="lg:sticky lg:top-20 h-fit">
          <Card>
            {report && <OptimizationPanel report={report} />}
          </Card>
        </aside>
      </div>
    </div>
  );
}

function NumField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-wide text-neutral-500 mb-1">{label}</span>
      <div className="flex">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="px-2 rounded-l-md bg-white/5 ring-1 ring-inset ring-[var(--border)] hover:bg-white/10 text-sm"
        >
          −
        </button>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isFinite(n)) return;
            onChange(Math.max(min, Math.min(max, n)));
          }}
          className="w-full text-center py-1 bg-[var(--background)] ring-1 ring-inset ring-[var(--border)] text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="px-2 rounded-r-md bg-white/5 ring-1 ring-inset ring-[var(--border)] hover:bg-white/10 text-sm"
        >
          +
        </button>
      </div>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-wide text-neutral-500 mb-1">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-center py-1 rounded-md bg-[var(--background)] ring-1 ring-inset ring-[var(--border)] text-sm"
      />
    </label>
  );
}
