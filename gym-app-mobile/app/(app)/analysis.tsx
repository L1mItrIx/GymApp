import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { Card } from "@/components/ui";
import { OptimizationPanel } from "@/components/OptimizationPanel";
import { useAuth } from "@/components/AuthGate";
import { ensurePlan, type FullPlan } from "@/lib/data";
import { analyzePlan, type PlanDayInput } from "@/lib/optimization";

export default function AnalysisScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [plan, setPlan] = useState<FullPlan | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    const p = await ensurePlan(session.user.id);
    setPlan(p);
  }, [session]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const report = useMemo(() => {
    if (!plan) return null;
    const input: PlanDayInput[] = plan.days.map((d) => ({
      dayOfWeek: d.day_of_week,
      isRest: d.is_rest,
      exercises: d.exercises.map((e) => ({ exerciseId: e.exercise_id, sets: e.sets })),
    }));
    return analyzePlan(input);
  }, [plan]);

  if (!plan || !report) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-neutral-400">Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerClassName="px-4 py-5 gap-4" className="bg-background">
      <Pressable
        onPress={() => router.replace("/(app)/today")}
        className="flex-row items-center gap-1 self-start"
      >
        <Ionicons name="arrow-back" size={14} color="#9ca3af" />
        <Text className="text-neutral-400 text-sm">Volver</Text>
      </Pressable>

      <View>
        <Text className="text-foreground text-2xl font-bold">Análisis</Text>
        <Text className="text-neutral-400 text-sm mt-1">
          Volumen, descanso 48 h, frecuencia y distribución por día.
        </Text>
      </View>

      <Card>
        <OptimizationPanel report={report} />
      </Card>

      <View className="h-8" />
    </ScrollView>
  );
}
