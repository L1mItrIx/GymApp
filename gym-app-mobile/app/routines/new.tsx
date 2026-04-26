import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button, Card, Input, Label } from "@/components/ui";
import { ExerciseList } from "@/components/ExerciseList";
import { MuscleSelector } from "@/components/MuscleSelector";
import { RoutineEditor } from "@/components/RoutineEditor";
import { VolumeMeter } from "@/components/VolumeMeter";
import { useApp } from "@/lib/store";
import type { DayOfWeek, MuscleGroup, RoutineExercise } from "@/lib/types";
import { assessAll, setsPerMuscle } from "@/lib/volume";

const DAYS: { id: DayOfWeek; label: string }[] = [
  { id: "monday",    label: "L" },
  { id: "tuesday",   label: "M" },
  { id: "wednesday", label: "X" },
  { id: "thursday",  label: "J" },
  { id: "friday",    label: "V" },
  { id: "saturday",  label: "S" },
  { id: "sunday",    label: "D" },
];

export default function NewRoutineScreen() {
  const router = useRouter();
  const addRoutine = useApp((s) => s.addRoutine);

  const [name, setName] = useState("Día de empuje");
  const [day, setDay] = useState<DayOfWeek>("monday");
  const [focus, setFocus] = useState<MuscleGroup[]>([]);
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);

  const addExercise = (ex: RoutineExercise) => setExercises((xs) => [...xs, ex]);
  const updateExercise = (i: number, patch: Partial<RoutineExercise>) =>
    setExercises((xs) => xs.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  const removeExercise = (i: number) =>
    setExercises((xs) => xs.filter((_, idx) => idx !== i));

  const assessments = useMemo(() => assessAll(setsPerMuscle(exercises)), [exercises]);

  const save = () => {
    if (!name.trim() || exercises.length === 0) return;
    const id = addRoutine({ name: name.trim(), day, focus, exercises });
    router.replace(`/routines/${id}` as any);
  };

  return (
    <ScrollView contentContainerClassName="px-5 py-5 gap-5" className="bg-background">
      <Card className="gap-3">
        <View>
          <Label>Nombre de la rutina</Label>
          <Input value={name} onChangeText={setName} placeholder="Ej: Día de pecho" />
        </View>
        <View>
          <Label>Día de la semana</Label>
          <View className="flex-row gap-1">
            {DAYS.map((d) => {
              const active = day === d.id;
              return (
                <Pressable
                  key={d.id}
                  onPress={() => setDay(d.id)}
                  className={[
                    "flex-1 py-2 rounded-md border items-center",
                    active ? "bg-indigo-500/15 border-indigo-500/40" : "bg-surface-2 border-border",
                  ].join(" ")}
                >
                  <Text
                    className={["text-sm font-medium", active ? "text-indigo-200" : "text-foreground"].join(" ")}
                  >
                    {d.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Card>

      <Card className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-foreground font-semibold">Músculos a enfocar</Text>
          <Text className="text-neutral-500 text-xs">
            {focus.length === 0 ? "Sin filtro" : `${focus.length} sel.`}
          </Text>
        </View>
        <MuscleSelector value={focus} onChange={setFocus} />
      </Card>

      <Card className="gap-3">
        <Text className="text-foreground font-semibold">Tu sesión</Text>
        <RoutineEditor
          exercises={exercises}
          onUpdate={updateExercise}
          onRemove={removeExercise}
        />
      </Card>

      <Card className="gap-3">
        <Text className="text-foreground font-semibold">Ejercicios sugeridos</Text>
        <ExerciseList focusedMuscles={focus} onAdd={addExercise} />
      </Card>

      <Card>
        <Text className="text-foreground font-semibold">Puntaje de volumen</Text>
        <Text className="text-neutral-500 text-xs mt-1 mb-3">
          Series por músculo en esta sesión. Secundarios cuentan 0.5×.
        </Text>
        <VolumeMeter assessments={assessments} />
      </Card>

      <Button onPress={save} disabled={!name.trim() || exercises.length === 0}>
        <Ionicons name="save-outline" size={16} color="#fff" />
        <Text className="text-white text-sm font-semibold">Guardar rutina</Text>
      </Button>

      <View className="h-8" />
    </ScrollView>
  );
}
