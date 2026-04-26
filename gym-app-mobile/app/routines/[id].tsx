import { useMemo } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Card, Input, Label } from "@/components/ui";
import { ExerciseList } from "@/components/ExerciseList";
import { MuscleSelector } from "@/components/MuscleSelector";
import { RoutineEditor } from "@/components/RoutineEditor";
import { VolumeMeter } from "@/components/VolumeMeter";
import { useApp } from "@/lib/store";
import type { DayOfWeek } from "@/lib/types";
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

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const routine = useApp((s) => s.routines.find((r) => r.id === id));
  const updateRoutine = useApp((s) => s.updateRoutine);
  const addExerciseToRoutine = useApp((s) => s.addExerciseToRoutine);
  const updateRoutineExercise = useApp((s) => s.updateRoutineExercise);
  const removeRoutineExercise = useApp((s) => s.removeRoutineExercise);
  const deleteRoutine = useApp((s) => s.deleteRoutine);

  const assessments = useMemo(
    () => (routine ? assessAll(setsPerMuscle(routine.exercises)) : []),
    [routine]
  );

  if (!routine) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-foreground text-lg font-semibold">Rutina no encontrada</Text>
        <Text className="text-neutral-400 text-center mt-2">
          Puede que la hayas eliminado.
        </Text>
        <Button className="mt-4" onPress={() => router.replace("/dashboard")}>
          Volver al dashboard
        </Button>
      </View>
    );
  }

  const onDelete = () => {
    Alert.alert(
      "Eliminar rutina",
      "¿Eliminar esta rutina? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            deleteRoutine(routine.id);
            router.replace("/dashboard");
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerClassName="px-5 py-5 gap-5" className="bg-background">
      <Card className="gap-3">
        <View>
          <Label>Nombre de la rutina</Label>
          <Input
            value={routine.name}
            onChangeText={(name) => updateRoutine(routine.id, { name })}
          />
        </View>
        <View>
          <Label>Día de la semana</Label>
          <View className="flex-row gap-1">
            {DAYS.map((d) => {
              const active = routine.day === d.id;
              return (
                <Pressable
                  key={d.id}
                  onPress={() => updateRoutine(routine.id, { day: d.id })}
                  className={[
                    "flex-1 py-2 rounded-md border items-center",
                    active ? "bg-indigo-500/15 border-indigo-500/40" : "bg-surface-2 border-border",
                  ].join(" ")}
                >
                  <Text className={["text-sm font-medium", active ? "text-indigo-200" : "text-foreground"].join(" ")}>
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
          <Text className="text-foreground font-semibold">Músculos enfocados</Text>
          <Text className="text-neutral-500 text-xs">
            {routine.focus.length === 0 ? "Sin filtro" : `${routine.focus.length} sel.`}
          </Text>
        </View>
        <MuscleSelector
          value={routine.focus}
          onChange={(focus) => updateRoutine(routine.id, { focus })}
        />
      </Card>

      <Card className="gap-3">
        <Text className="text-foreground font-semibold">Tu sesión</Text>
        <RoutineEditor
          exercises={routine.exercises}
          onUpdate={(i, patch) => updateRoutineExercise(routine.id, i, patch)}
          onRemove={(i) => removeRoutineExercise(routine.id, i)}
        />
      </Card>

      <Card className="gap-3">
        <Text className="text-foreground font-semibold">Añadir más ejercicios</Text>
        <ExerciseList
          focusedMuscles={routine.focus}
          onAdd={(ex) => addExerciseToRoutine(routine.id, ex)}
        />
      </Card>

      <Card>
        <Text className="text-foreground font-semibold">Puntaje de volumen</Text>
        <Text className="text-neutral-500 text-xs mt-1 mb-3">
          Estado de esta sesión. El dashboard suma todas las rutinas para el total semanal.
        </Text>
        <VolumeMeter assessments={assessments} />
      </Card>

      <Button variant="danger" onPress={onDelete}>
        <Ionicons name="trash-outline" size={16} color="#fca5a5" />
        <Text className="text-red-300 text-sm font-semibold">Eliminar rutina</Text>
      </Button>

      <View className="h-8" />
    </ScrollView>
  );
}
