import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { Button, Card } from "@/components/ui";
import { useAuth } from "@/components/AuthGate";
import { ExerciseList } from "@/components/ExerciseList";
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
import { exerciseById } from "@/lib/exercises";
import { MUSCLE_LABELS } from "@/lib/muscles";
import type { MuscleGroup, RoutineExercise } from "@/lib/types";

export default function LogSessionScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const { session: auth } = useAuth();
  const [session, setSession] = useState<FullSession | null>(null);
  const [planFocus, setPlanFocus] = useState<MuscleGroup[]>([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [history, setHistory] = useState<Record<string, ExerciseHistoryEntry[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !date) return;
    (async () => {
      const dow = (new Date(date + "T00:00:00").getDay() + 6) % 7;
      const plan = await getActivePlan(auth.user.id);
      const planDay = plan?.days.find((d) => d.day_of_week === dow);

      let s = await getSessionByDate(auth.user.id, date);
      if (!s) {
        await ensureSession({
          userId: auth.user.id,
          date,
          planDayId: planDay?.id ?? null,
        });
        if (planDay && !planDay.is_rest && planDay.exercises.length > 0) {
          s = await getSessionByDate(auth.user.id, date);
          if (s) {
            for (let i = 0; i < planDay.exercises.length; i++) {
              await ensureSessionExercise(s.id, planDay.exercises[i].exercise_id, i);
            }
          }
        }
        s = await getSessionByDate(auth.user.id, date);
      }
      setSession(s);
      setPlanFocus((planDay?.focus as MuscleGroup[]) ?? []);

      if (s) {
        const map: Record<string, ExerciseHistoryEntry[]> = {};
        for (const ex of s.exercises) {
          map[ex.exercise_id] = await exerciseHistory(auth.user.id, ex.exercise_id, 3);
        }
        setHistory(map);
      }
      setLoading(false);
    })();
  }, [auth, date]);

  const reload = async () => {
    if (!auth) return;
    const s = await getSessionByDate(auth.user.id, date);
    setSession(s);
    if (s) {
      const map: Record<string, ExerciseHistoryEntry[]> = {};
      for (const ex of s.exercises) {
        map[ex.exercise_id] = await exerciseHistory(auth.user.id, ex.exercise_id, 3);
      }
      setHistory(map);
    }
  };

  const onAddExercise = async (input: RoutineExercise) => {
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
          else
            sets.push({
              id: `tmp-${setNumber}`,
              session_exercise_id: sessionExerciseId,
              set_number: setNumber,
              weight_kg: null,
              reps: null,
              rir: null,
              ...patch,
            });
          return { ...e, sets };
        }),
      };
    });
  };

  if (loading || !session) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-neutral-400">Cargando...</Text>
      </View>
    );
  }

  const dateLabel = new Date(date + "T00:00:00").toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <ScrollView contentContainerClassName="px-4 py-5 gap-4" className="bg-background">
      <Pressable
        onPress={() => router.replace("/(app)/progress")}
        className="flex-row items-center gap-1 self-start"
      >
        <Ionicons name="arrow-back" size={14} color="#9ca3af" />
        <Text className="text-neutral-400 text-sm">Volver al calendario</Text>
      </Pressable>

      <View>
        <Text className="text-foreground text-2xl font-bold capitalize">{dateLabel}</Text>
        <Text className="text-neutral-400 text-sm mt-1">
          Registra tus series. Peso, reps y RIR son opcionales.
        </Text>
      </View>

      <View className="gap-3">
        {session.exercises.length === 0 && (
          <Card>
            <Text className="text-neutral-400 text-sm text-center py-4">
              No hay ejercicios prescritos. Añade los que hayas hecho.
            </Text>
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
      </View>

      {showCatalog ? (
        <Card>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-foreground font-semibold">Añadir ejercicio</Text>
            <Pressable onPress={() => setShowCatalog(false)}>
              <Text className="text-neutral-400 text-xs">Cerrar</Text>
            </Pressable>
          </View>
          <ExerciseList focusedMuscles={planFocus} onAdd={onAddExercise} />
        </Card>
      ) : (
        <Pressable onPress={() => setShowCatalog(true)}>
          <Button variant="secondary">
            <Ionicons name="add" size={14} color="#ededed" />
            <Text className="text-foreground text-sm font-semibold">Añadir ejercicio</Text>
          </Button>
        </Pressable>
      )}

      <View className="h-8" />
    </ScrollView>
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

  const maxSet = Math.max(4, ...sessionExercise.sets.map((s) => s.set_number));
  const slots = Array.from({ length: maxSet }, (_, i) => i + 1);

  return (
    <Card>
      <View>
        <Text className="text-foreground text-base font-medium">{data.name}</Text>
        <Text className="text-neutral-400 text-[11px] mt-0.5">
          {MUSCLE_LABELS[data.primary]}
        </Text>
      </View>

      <View className="mt-3 flex-row gap-1.5 mb-1">
        <View className="w-8" />
        <Text className="flex-1 text-[10px] uppercase text-neutral-500 text-center">Peso (kg)</Text>
        <Text className="flex-1 text-[10px] uppercase text-neutral-500 text-center">Reps</Text>
        <Text className="flex-1 text-[10px] uppercase text-neutral-500 text-center">RIR</Text>
      </View>

      <View className="gap-1.5">
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
      </View>

      {history.length > 0 && (
        <View className="mt-4 p-3 rounded-md bg-surface-2 border border-border">
          <Text className="text-neutral-400 text-xs mb-1.5">Últimas sesiones:</Text>
          {history.slice(0, 3).map((h, i) => {
            const max = Math.max(0, ...h.sets.map((s) => s.weight_kg ?? 0));
            const reps = h.sets.find((s) => (s.weight_kg ?? 0) === max && max > 0)?.reps;
            return (
              <View key={i} className="flex-row justify-between mt-0.5">
                <Text className="text-neutral-300 text-xs">
                  {new Date(h.date + "T00:00:00").toLocaleDateString("es", {
                    day: "numeric",
                    month: "short",
                  })}
                </Text>
                <Text className="text-neutral-400 text-xs">
                  {h.sets.length} sets
                  {max > 0 && (
                    <>
                      {" · top "}
                      <Text className="text-emerald-400">
                        {max} kg{reps ? ` × ${reps}` : ""}
                      </Text>
                    </>
                  )}
                </Text>
              </View>
            );
          })}
        </View>
      )}
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
    <View className="flex-row gap-1.5">
      <View className="size-8 items-center justify-center rounded-md bg-white/5">
        <Text className="text-foreground text-sm font-medium">{setNumber}</Text>
      </View>
      <TextInput
        defaultValue={weight?.toString() ?? ""}
        onEndEditing={(e) => onChange({ weight_kg: num(e.nativeEvent.text) })}
        keyboardType="decimal-pad"
        placeholder="—"
        placeholderTextColor="#6b7280"
        className="flex-1 px-2 py-1.5 rounded-md bg-surface-2 border border-border text-foreground text-sm text-center"
      />
      <TextInput
        defaultValue={reps?.toString() ?? ""}
        onEndEditing={(e) => onChange({ reps: num(e.nativeEvent.text) })}
        keyboardType="number-pad"
        placeholder="—"
        placeholderTextColor="#6b7280"
        className="flex-1 px-2 py-1.5 rounded-md bg-surface-2 border border-border text-foreground text-sm text-center"
      />
      <TextInput
        defaultValue={rir?.toString() ?? ""}
        onEndEditing={(e) => onChange({ rir: num(e.nativeEvent.text) })}
        keyboardType="number-pad"
        placeholder="—"
        placeholderTextColor="#6b7280"
        className="flex-1 px-2 py-1.5 rounded-md bg-surface-2 border border-border text-foreground text-sm text-center"
      />
    </View>
  );
}
