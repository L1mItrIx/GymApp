import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { Card } from "@/components/ui";
import { ExerciseList } from "@/components/ExerciseList";
import { MuscleSelector } from "@/components/MuscleSelector";
import { useAuth } from "@/components/AuthGate";
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
import type { MuscleGroup, RoutineExercise } from "@/lib/types";

const DAY_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function AgendaScreen() {
  const { session } = useAuth();
  const [plan, setPlan] = useState<FullPlan | null>(null);
  const [activeDow, setActiveDow] = useState(() => (new Date().getDay() + 6) % 7);

  const refresh = useCallback(async () => {
    if (!session) return;
    const p = await ensurePlan(session.user.id);
    setPlan(p);
  }, [session]);

  useEffect(() => { refresh(); }, [refresh]);
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  if (!plan) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-neutral-400">Cargando agenda...</Text>
      </View>
    );
  }

  const day = plan.days.find((d) => d.day_of_week === activeDow)!;

  const toggleRest = async () => {
    await updatePlanDay(day.id, { is_rest: !day.is_rest });
    if (!day.is_rest) await clearPlanDay(day.id);
    await refresh();
  };

  const setName = async (name: string) => {
    setPlan((prev) =>
      prev && {
        ...prev,
        days: prev.days.map((d) => (d.id === day.id ? { ...d, name: name || null } : d)),
      }
    );
    await updatePlanDay(day.id, { name: name || null });
  };

  const setFocus = async (focus: MuscleGroup[]) => {
    setPlan((prev) =>
      prev && {
        ...prev,
        days: prev.days.map((d) => (d.id === day.id ? { ...d, focus } : d)),
      }
    );
    await updatePlanDay(day.id, { focus });
  };

  const onAddExercise = async (input: RoutineExercise) => {
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

  const onUpdateExercise = async (
    id: string,
    patch: { sets?: number; reps?: string; rir?: number | null }
  ) => {
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
    await updatePlanExercise(id, patch);
  };

  const onRemoveExercise = async (id: string) => {
    await deletePlanExercise(id);
    await refresh();
  };

  return (
    <ScrollView contentContainerClassName="px-4 py-5 gap-4" className="bg-background">
      <View>
        <Text className="text-foreground text-2xl font-bold">Mi agenda semanal</Text>
        <Text className="text-neutral-400 text-sm mt-1">
          Edita cada día, marca descansos. Tu rutina persistente.
        </Text>
      </View>

      {/* Day picker — green for rest, indigo for training, like templates */}
      <View className="flex-row gap-1.5">
        {plan.days.map((d, i) => {
          const isActive = activeDow === i;
          const sets = d.exercises.reduce((a, e) => a + e.sets, 0);
          return (
            <Pressable
              key={d.id}
              onPress={() => setActiveDow(i)}
              className={[
                "flex-1 p-2 rounded-md border",
                d.is_rest
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-indigo-500/10 border-indigo-500/30",
                isActive && (d.is_rest ? "border-emerald-400 border-2" : "border-indigo-400 border-2"),
              ].join(" ")}
            >
              <Text
                className={[
                  "text-[10px] uppercase text-center",
                  d.is_rest ? "text-emerald-300/80" : "text-indigo-300/80",
                ].join(" ")}
              >
                {DAY_LABELS[i].slice(0, 3)}
              </Text>
              {d.is_rest ? (
                <Text className="text-emerald-300 text-[10px] text-center mt-1">Descanso</Text>
              ) : (
                <>
                  <Text className="text-foreground text-[11px] font-medium text-center mt-1" numberOfLines={1}>
                    {d.name ?? "Entreno"}
                  </Text>
                  <Text className="text-neutral-400 text-[9px] text-center mt-0.5">
                    {sets > 0 ? `${sets}s` : "—"}
                  </Text>
                </>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Day editor — keyed by day.id so it remounts (clears state) when switching */}
      <View key={day.id} className="gap-4">
        <Card>
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-row items-center gap-2 flex-1">
              <Text className="text-foreground text-xl font-semibold">
                {DAY_LABELS[activeDow]}
              </Text>
              <View
                className={[
                  "flex-row items-center gap-1 px-2 py-0.5 rounded-full border",
                  day.is_rest
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-indigo-500/10 border-indigo-500/30",
                ].join(" ")}
              >
                <Ionicons
                  name={day.is_rest ? "cafe" : "barbell"}
                  size={10}
                  color={day.is_rest ? "#34d399" : "#a5b4fc"}
                />
                <Text
                  className={[
                    "text-[10px]",
                    day.is_rest ? "text-emerald-300" : "text-indigo-300",
                  ].join(" ")}
                >
                  {day.is_rest ? "Descanso" : "Entreno"}
                </Text>
              </View>
            </View>
          </View>

          {/* Toggle: Entreno / Descanso */}
          <View className="flex-row mt-3 bg-surface-2 rounded-md border border-border p-1">
            <Pressable
              onPress={() => day.is_rest && toggleRest()}
              className={[
                "flex-1 py-1.5 rounded items-center",
                !day.is_rest ? "bg-indigo-500" : "",
              ].join(" ")}
            >
              <Text
                className={[
                  "text-xs",
                  !day.is_rest ? "text-white font-semibold" : "text-neutral-400",
                ].join(" ")}
              >
                Entreno
              </Text>
            </Pressable>
            <Pressable
              onPress={() => !day.is_rest && toggleRest()}
              className={[
                "flex-1 py-1.5 rounded items-center",
                day.is_rest ? "bg-emerald-500" : "",
              ].join(" ")}
            >
              <Text
                className={[
                  "text-xs",
                  day.is_rest ? "text-white font-semibold" : "text-neutral-400",
                ].join(" ")}
              >
                Descanso
              </Text>
            </Pressable>
          </View>

          {!day.is_rest && (
            <View className="mt-4 gap-4">
              <View>
                <Text className="text-neutral-400 text-xs font-medium mb-1.5">
                  Nombre del día
                </Text>
                <TextInput
                  defaultValue={day.name ?? ""}
                  onEndEditing={(e) => setName(e.nativeEvent.text)}
                  placeholder="Ej: Push, Pull, Pierna"
                  placeholderTextColor="#6b7280"
                  className="bg-surface-2 border border-border rounded-md px-3 py-2 text-foreground text-sm"
                />
              </View>

              <View>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-neutral-400 text-xs font-medium">Músculos enfocados</Text>
                  <Text className="text-neutral-500 text-[10px]">
                    {day.focus.length === 0 ? "Sin filtro" : `${day.focus.length} sel.`}
                  </Text>
                </View>
                <MuscleSelector
                  value={day.focus as MuscleGroup[]}
                  onChange={(focus) => setFocus(focus)}
                />
              </View>
            </View>
          )}
        </Card>

        {!day.is_rest ? (
          <>
            <Card>
              <Text className="text-foreground font-semibold mb-3">Ejercicios del día</Text>
              {day.exercises.length === 0 ? (
                <View className="border border-dashed border-border rounded-md p-4">
                  <Text className="text-neutral-500 italic text-xs text-center">
                    Aún no añadiste ejercicios.
                  </Text>
                </View>
              ) : (
                <View className="gap-2">
                  {day.exercises.map((ex) => {
                    const data = exerciseById(ex.exercise_id);
                    if (!data) return null;
                    return (
                      <View
                        key={ex.id}
                        className="rounded-md p-3 bg-surface-2 border border-border"
                      >
                        <View className="flex-row items-start justify-between gap-2">
                          <View className="flex-1">
                            <Text className="text-foreground text-sm font-medium" numberOfLines={1}>
                              {data.name}
                            </Text>
                            <Text className="text-neutral-400 text-[11px]">
                              {MUSCLE_LABELS[data.primary]}
                            </Text>
                          </View>
                          <Pressable onPress={() => onRemoveExercise(ex.id)} hitSlop={8}>
                            <Ionicons name="trash-outline" size={16} color="#9ca3af" />
                          </Pressable>
                        </View>

                        <View className="flex-row gap-2 mt-2">
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
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </Card>

            <Card>
              <Text className="text-foreground font-semibold mb-3">Añadir ejercicios</Text>
              <ExerciseList
                focusedMuscles={day.focus as MuscleGroup[]}
                onAdd={onAddExercise}
              />
            </Card>
          </>
        ) : (
          <Card>
            <View className="items-center py-6">
              <Ionicons name="cafe" size={28} color="#34d399" />
              <Text className="text-neutral-400 text-sm mt-3 text-center">
                Día de descanso. Cambia a entreno para añadir ejercicios.
              </Text>
            </View>
          </Card>
        )}
      </View>

      <View className="h-8" />
    </ScrollView>
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
    <View className="flex-1">
      <Text className="text-[10px] uppercase text-neutral-500 mb-1">{label}</Text>
      <View className="flex-row border border-border rounded-md overflow-hidden">
        <Pressable
          onPress={() => onChange(Math.max(min, value - 1))}
          className="px-2 bg-white/5 active:bg-white/10 justify-center"
        >
          <Text className="text-foreground text-base">−</Text>
        </Pressable>
        <View className="flex-1 bg-background py-1.5 items-center justify-center">
          <Text className="text-foreground text-sm">{value}</Text>
        </View>
        <Pressable
          onPress={() => onChange(Math.min(max, value + 1))}
          className="px-2 bg-white/5 active:bg-white/10 justify-center"
        >
          <Text className="text-foreground text-base">+</Text>
        </Pressable>
      </View>
    </View>
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
    <View className="flex-1">
      <Text className="text-[10px] uppercase text-neutral-500 mb-1">{label}</Text>
      <TextInput
        defaultValue={value}
        onEndEditing={(e) => onChange(e.nativeEvent.text)}
        placeholderTextColor="#6b7280"
        className="border border-border rounded-md bg-background py-1.5 px-2 text-center text-foreground text-sm"
      />
    </View>
  );
}
