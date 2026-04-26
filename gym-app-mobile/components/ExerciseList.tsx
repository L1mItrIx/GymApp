import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EXERCISES, exercisesForMuscles } from "@/lib/exercises";
import { MUSCLE_LABELS } from "@/lib/muscles";
import type { EquipmentType, Exercise, MuscleGroup, RoutineExercise } from "@/lib/types";
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

const FILTERS: (EquipmentType | "all")[] = [
  "all",
  "machine",
  "cable",
  "barbell",
  "dumbbell",
  "smith",
  "bodyweight",
];

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

  return (
    <View className="gap-3">
      <Input
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar ejercicio..."
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-1.5">
        {FILTERS.map((eq) => {
          const active = equipmentFilter === eq;
          return (
            <Pressable
              key={eq}
              onPress={() => setEquipmentFilter(eq)}
              className={[
                "px-3 py-1 rounded-full border",
                active
                  ? "bg-indigo-500/20 border-indigo-500/40"
                  : "bg-white/5 border-border",
              ].join(" ")}
            >
              <Text className={["text-xs", active ? "text-indigo-200" : "text-neutral-400"].join(" ")}>
                {eq === "all" ? "Todo" : EQUIPMENT_LABELS[eq]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View className="gap-1.5">
        {suggested.map((ex) => {
          const isPrimary = focusedMuscles.includes(ex.primary);
          return (
            <View
              key={ex.id}
              className="flex-row items-center justify-between gap-3 p-3 rounded-lg bg-surface-2 border border-border"
            >
              <View className="flex-1">
                <Text className="text-foreground text-sm font-medium" numberOfLines={1}>
                  {ex.name}
                </Text>
                <Text className="text-neutral-400 text-[11px] mt-0.5" numberOfLines={1}>
                  <Text className={isPrimary ? "text-indigo-300" : "text-neutral-400"}>
                    {MUSCLE_LABELS[ex.primary]}
                  </Text>
                  {" · "}
                  {EQUIPMENT_LABELS[ex.equipment]}
                  {ex.compound && " · Compuesto"}
                </Text>
              </View>
              <Pressable
                onPress={() =>
                  onAdd({
                    exerciseId: ex.id,
                    sets: 3,
                    reps: ex.compound ? "6-10" : "10-15",
                    rir: 2,
                  })
                }
                className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 active:bg-indigo-500/25"
              >
                <Ionicons name="add" size={14} color="#a5b4fc" />
                <Text className="text-indigo-300 text-xs font-medium">Añadir</Text>
              </Pressable>
            </View>
          );
        })}
        {suggested.length === 0 && (
          <Text className="text-neutral-500 italic text-sm p-3">Sin resultados.</Text>
        )}
      </View>
    </View>
  );
}
