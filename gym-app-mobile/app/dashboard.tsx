import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Button, Card, H1, Muted } from "@/components/ui";
import { VolumeMeter } from "@/components/VolumeMeter";
import { MUSCLE_LABELS } from "@/lib/muscles";
import { useApp } from "@/lib/store";
import type { DayOfWeek } from "@/lib/types";
import { assessAll, weeklySetsFromRoutines } from "@/lib/volume";

const DAY_LABEL: Record<DayOfWeek, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};

const DAY_ORDER: DayOfWeek[] = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
];

const GOAL_LABEL: Record<string, string> = {
  hypertrophy: "Hipertrofia",
  strength: "Fuerza",
  weight_loss: "Pérdida de peso",
  endurance: "Resistencia",
  general_fitness: "Estado físico general",
};

export default function DashboardScreen() {
  const profile = useApp((s) => s.profile);
  const routines = useApp((s) => s.routines);
  const hydrated = useApp((s) => s.hydrated);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const weekly = useMemo(() => assessAll(weeklySetsFromRoutines(routines)), [routines]);
  const sortedRoutines = useMemo(
    () => [...routines].sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)),
    [routines]
  );

  if (!mounted || !hydrated) {
    return <View className="flex-1 bg-background" />;
  }

  return (
    <ScrollView contentContainerClassName="px-5 py-6 gap-5" className="bg-background">
      <View>
        <H1>{profile?.name ? `Hola, ${profile.name}` : "Dashboard"}</H1>
        {profile && (
          <Muted className="mt-1">
            {GOAL_LABEL[profile.goal]} · {profile.daysPerWeek} días/semana
          </Muted>
        )}
      </View>

      <Link href="/routines/new" asChild>
        <Button>
          <Ionicons name="add" size={16} color="#fff" />
          <Text className="text-white text-sm font-semibold">Nueva rutina</Text>
        </Button>
      </Link>

      <View>
        <Text className="text-[10px] uppercase tracking-wider text-neutral-500 mb-2">
          Tus rutinas ({routines.length})
        </Text>

        {sortedRoutines.length === 0 ? (
          <Card className="items-center py-8">
            <Ionicons name="calendar-outline" size={28} color="#6b7280" />
            <Muted className="mt-2 text-center">Todavía no tienes rutinas.</Muted>
            <Link href="/routines/new" asChild>
              <Button className="mt-4">Crear mi primera rutina</Button>
            </Link>
          </Card>
        ) : (
          <View className="gap-2">
            {sortedRoutines.map((r) => {
              const totalSets = r.exercises.reduce((a, e) => a + e.sets, 0);
              return (
                <Link key={r.id} href={`/routines/${r.id}` as any} asChild>
                  <Pressable>
                    <Card className="active:bg-surface-2">
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1">
                          <Text className="text-indigo-300 text-[10px] uppercase tracking-wider">
                            {DAY_LABEL[r.day]}
                          </Text>
                          <Text className="text-foreground font-semibold mt-1">{r.name}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#6b7280" />
                      </View>
                      <Text className="text-neutral-400 text-xs mt-2">
                        {r.exercises.length} ejercicios · {totalSets} series
                      </Text>
                      {r.focus.length > 0 && (
                        <View className="flex-row flex-wrap gap-1 mt-2">
                          {r.focus.slice(0, 4).map((m) => (
                            <View
                              key={m}
                              className="bg-white/5 border border-border rounded-full px-2 py-0.5"
                            >
                              <Text className="text-neutral-300 text-[10px]">{MUSCLE_LABELS[m]}</Text>
                            </View>
                          ))}
                          {r.focus.length > 4 && (
                            <Text className="text-neutral-400 text-[10px] self-center">
                              +{r.focus.length - 4}
                            </Text>
                          )}
                        </View>
                      )}
                    </Card>
                  </Pressable>
                </Link>
              );
            })}
          </View>
        )}
      </View>

      <Card>
        <Text className="text-foreground font-semibold">Volumen semanal</Text>
        <Muted className="text-xs mt-1 mb-3">
          Suma de series por músculo de todas tus rutinas. Los músculos secundarios cuentan 0.5×.
        </Muted>
        <VolumeMeter assessments={weekly} />
      </Card>

      <View className="h-8" />
    </ScrollView>
  );
}
