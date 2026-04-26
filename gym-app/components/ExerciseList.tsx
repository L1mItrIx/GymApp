"use client";

import { useMemo, useState } from "react";
import { EXERCISES, exercisesForMuscles } from "@/lib/exercises";
import { MUSCLE_LABELS } from "@/lib/muscles";
import type { EquipmentType, Exercise, MuscleGroup, RoutineExercise } from "@/lib/types";
import { Plus } from "lucide-react";
import { Input } from "./ui";

const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  machine: "Máquina",
  cable: "Polea",
  barbell: "Barra",
  dumbbell: "Mancuernas",
  smith: "Smith",
  kettlebell: "Kettlebell",
  bodyweight: "Peso corporal",
};

export function ExerciseList({
  focusedMuscles,
  onAdd,
}: {
  focusedMuscles: MuscleGroup[];
  onAdd: (exercise: RoutineExercise) => void;
}) {
  const [query, setQuery] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentType | "all">("all");

  const suggested = useMemo(() => {
    const base: Exercise[] =
      focusedMuscles.length === 0 ? EXERCISES : exercisesForMuscles(focusedMuscles);
    const q = query.trim().toLowerCase();
    return base.filter((e) => {
      if (equipmentFilter !== "all" && e.equipment !== equipmentFilter) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        MUSCLE_LABELS[e.primary].toLowerCase().includes(q)
      );
    });
  }, [focusedMuscles, query, equipmentFilter]);

  const equipmentOptions: (EquipmentType | "all")[] = [
    "all",
    "machine",
    "cable",
    "barbell",
    "dumbbell",
    "smith",
    "bodyweight",
  ];

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar ejercicio..."
          className="flex-1"
        />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {equipmentOptions.map((eq) => (
          <button
            key={eq}
            onClick={() => setEquipmentFilter(eq)}
            className={[
              "px-2.5 py-1 text-xs rounded-full ring-1 ring-inset transition",
              equipmentFilter === eq
                ? "bg-indigo-500/15 text-indigo-300 ring-indigo-500/30"
                : "bg-white/5 text-neutral-400 ring-[var(--border)] hover:text-neutral-200",
            ].join(" ")}
          >
            {eq === "all" ? "Todo" : EQUIPMENT_LABELS[eq]}
          </button>
        ))}
      </div>

      <ul className="max-h-[480px] overflow-y-auto space-y-1.5 scrollbar-thin pr-1">
        {suggested.map((ex) => {
          const isPrimary = focusedMuscles.includes(ex.primary);
          return (
            <li
              key={ex.id}
              className="flex items-center justify-between gap-3 p-2.5 rounded-md bg-[var(--surface-2)] ring-1 ring-inset ring-[var(--border)] hover:ring-white/20"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{ex.name}</div>
                <div className="text-[11px] text-neutral-400 flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                  <span className={isPrimary ? "text-indigo-300" : ""}>
                    {MUSCLE_LABELS[ex.primary]}
                  </span>
                  <span>· {EQUIPMENT_LABELS[ex.equipment]}</span>
                  {ex.compound && <span>· Compuesto</span>}
                </div>
              </div>
              <button
                onClick={() =>
                  onAdd({
                    exerciseId: ex.id,
                    sets: 3,
                    reps: ex.compound ? "6-10" : "10-15",
                    rir: 2,
                  })
                }
                className="shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-indigo-500/15 text-indigo-300 ring-1 ring-inset ring-indigo-500/30 hover:bg-indigo-500/25"
              >
                <Plus className="size-3.5" /> Añadir
              </button>
            </li>
          );
        })}
        {suggested.length === 0 && (
          <li className="text-sm text-neutral-500 italic p-3">Sin resultados.</li>
        )}
      </ul>
    </div>
  );
}
