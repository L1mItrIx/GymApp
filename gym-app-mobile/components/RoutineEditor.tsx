import { Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { exerciseById } from "@/lib/exercises";
import { MUSCLE_LABELS } from "@/lib/muscles";
import type { RoutineExercise } from "@/lib/types";

export function RoutineEditor({
  exercises,
  onUpdate,
  onRemove,
}: {
  exercises: RoutineExercise[];
  onUpdate: (index: number, patch: Partial<RoutineExercise>) => void;
  onRemove: (index: number) => void;
}) {
  if (exercises.length === 0) {
    return (
      <View className="border border-dashed border-border rounded-lg p-6 items-center">
        <Text className="text-neutral-500 italic text-sm text-center">
          Aún no has añadido ejercicios. Selecciónalos desde la lista de ejercicios.
        </Text>
      </View>
    );
  }

  const totalSets = exercises.reduce((acc, e) => acc + e.sets, 0);

  return (
    <View className="gap-2">
      {exercises.map((re, i) => {
        const ex = exerciseById(re.exerciseId);
        if (!ex) return null;
        return (
          <View
            key={`${re.exerciseId}-${i}`}
            className="rounded-lg p-3 bg-surface-2 border border-border"
          >
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="text-foreground text-sm font-medium" numberOfLines={1}>
                  {ex.name}
                </Text>
                <Text className="text-neutral-400 text-[11px] mt-0.5" numberOfLines={2}>
                  {MUSCLE_LABELS[ex.primary]}
                  {ex.secondary.length > 0 &&
                    ` · sec: ${ex.secondary.map((s) => MUSCLE_LABELS[s]).join(", ")}`}
                </Text>
              </View>
              <Pressable onPress={() => onRemove(i)} hitSlop={8} className="p-1">
                <Ionicons name="trash-outline" size={18} color="#9ca3af" />
              </Pressable>
            </View>

            <View className="mt-3 flex-row gap-2">
              <NumField
                label="Series"
                value={re.sets}
                min={1}
                max={12}
                onChange={(v) => onUpdate(i, { sets: v })}
              />
              <TextField
                label="Reps"
                value={re.reps}
                onChange={(v) => onUpdate(i, { reps: v })}
              />
              <NumField
                label="RIR"
                value={re.rir ?? 0}
                min={0}
                max={6}
                onChange={(v) => onUpdate(i, { rir: v })}
              />
            </View>
          </View>
        );
      })}
      <Text className="text-neutral-500 text-xs pt-1">
        Total de series en esta sesión:{" "}
        <Text className="text-neutral-300 font-medium">{totalSets}</Text>
      </Text>
    </View>
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
      <Text className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">{label}</Text>
      <View className="flex-row items-stretch border border-border rounded-md overflow-hidden">
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
      <Text className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholderTextColor="#6b7280"
        className="border border-border rounded-md bg-background py-1.5 px-2 text-center text-foreground text-sm"
      />
    </View>
  );
}
