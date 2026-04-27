import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { Button, Card } from "@/components/ui";
import { useAuth } from "@/components/AuthGate";
import { ensurePlan, getProfile, type FullPlan } from "@/lib/data";
import { exerciseById } from "@/lib/exercises";
import { MUSCLE_LABELS } from "@/lib/muscles";
import type { MuscleGroup } from "@/lib/types";

const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function todayDayOfWeek() {
  return (new Date().getDay() + 6) % 7;
}

function todayISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset();
  return new Date(d.getTime() - tz * 60_000).toISOString().slice(0, 10);
}

export default function TodayScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [plan, setPlan] = useState<FullPlan | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) return;
    const profile = await getProfile(session.user.id).catch(() => null);
    if (!profile) {
      router.replace("/onboarding");
      return;
    }
    setName(profile.name);
    const p = await ensurePlan(session.user.id);
    setPlan(p);
    setLoading(false);
  }, [session, router]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading || !plan) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-neutral-400">Cargando...</Text>
      </View>
    );
  }

  const dow = todayDayOfWeek();
  const today = plan.days.find((d) => d.day_of_week === dow);
  const isRest = !today || today.is_rest;
  const dateISO = todayISO();

  return (
    <ScrollView contentContainerClassName="px-4 py-5 gap-4" className="bg-background">
      <View
        className={[
          "self-start flex-row items-center gap-2 px-3 py-1 rounded-full border",
          isRest
            ? "bg-emerald-500/10 border-emerald-500/30"
            : "bg-indigo-500/10 border-indigo-500/30",
        ].join(" ")}
      >
        <Ionicons
          name={isRest ? "cafe" : "barbell"}
          size={12}
          color={isRest ? "#34d399" : "#a5b4fc"}
        />
        <Text
          className={[
            "text-[11px]",
            isRest ? "text-emerald-300" : "text-indigo-300",
          ].join(" ")}
        >
          {isRest ? "Día de descanso" : `Día de entreno · ${today?.name ?? "Sin nombre"}`}
        </Text>
      </View>

      <View>
        <Text className="text-foreground text-2xl font-bold">
          {isRest ? `Descansa hoy, ${name}` : `A entrenar, ${name}`}
        </Text>
        <Text className="text-neutral-400 text-sm mt-1">
          Hoy es <Text className="text-neutral-200">{DAY_NAMES[dow]}</Text>
          {!isRest && today?.focus && today.focus.length > 0 && (
            <>
              {" · enfocas "}
              <Text className="text-neutral-200">
                {(today.focus as MuscleGroup[]).slice(0, 3).map((m) => MUSCLE_LABELS[m]).join(", ")}
              </Text>
            </>
          )}
        </Text>
      </View>

      {isRest ? (
        <Card>
          <View className="flex-row items-start gap-3">
            <Ionicons name="cafe" size={20} color="#34d399" />
            <View className="flex-1">
              <Text className="text-foreground font-medium">Día sin sesión</Text>
              <Text className="text-neutral-400 text-sm mt-1">
                Hoy no toca entrenar según tu agenda. Aprovecha para recuperarte.
              </Text>
              <Link href="/(app)/agenda" asChild>
                <Pressable className="mt-4">
                  <Button variant="secondary">
                    <Ionicons name="calendar" size={14} color="#ededed" />
                    <Text className="text-foreground text-sm font-semibold">Ver agenda</Text>
                  </Button>
                </Pressable>
              </Link>
            </View>
          </View>
        </Card>
      ) : (
        <Card>
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-indigo-300 text-[10px] uppercase tracking-wider">
                {DAY_NAMES[dow]}
              </Text>
              <Text className="text-foreground text-lg font-semibold mt-1">
                {today?.name ?? "Entrenamiento"}
              </Text>
            </View>
            <Link href={`/(app)/progress/${dateISO}`} asChild>
              <Pressable>
                <Button>
                  <Text className="text-white text-sm font-semibold">Registrar</Text>
                </Button>
              </Pressable>
            </Link>
          </View>

          <View className="gap-1.5 mt-4">
            {today!.exercises.length === 0 ? (
              <Text className="text-neutral-500 italic text-sm">
                No hay ejercicios. Configura este día desde la agenda.
              </Text>
            ) : (
              today!.exercises.map((ex) => {
                const data = exerciseById(ex.exercise_id);
                if (!data) return null;
                return (
                  <View
                    key={ex.id}
                    className="flex-row items-center justify-between gap-2 p-3 rounded-md bg-surface-2 border border-border"
                  >
                    <View className="flex-1">
                      <Text className="text-foreground text-sm font-medium" numberOfLines={1}>
                        {data.name}
                      </Text>
                      <Text className="text-neutral-400 text-[11px] mt-0.5">
                        {MUSCLE_LABELS[data.primary]} · {ex.sets} × {ex.reps}
                        {ex.rir != null && ` · RIR ${ex.rir}`}
                      </Text>
                    </View>
                    <Ionicons name="barbell" size={14} color="#6b7280" />
                  </View>
                );
              })
            )}
          </View>
        </Card>
      )}

      <Card>
        <Text className="text-foreground font-semibold mb-2">Accesos rápidos</Text>
        <QuickLink href="/(app)/agenda" label="Editar mi agenda" icon="calendar" />
        <QuickLink href={`/(app)/progress/${dateISO}`} label="Registrar lo de hoy" icon="create" />
        <QuickLink href="/(app)/progress" label="Calendario de sesiones" icon="bar-chart" />
        <QuickLink href="/(app)/analysis" label="Análisis de optimización" icon="speedometer" />
      </Card>
    </ScrollView>
  );
}

function QuickLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Link href={href as any} asChild>
      <Pressable className="flex-row items-center justify-between py-2.5 active:bg-white/5 rounded-md px-1">
        <View className="flex-row items-center gap-2">
          <Ionicons name={icon} size={16} color="#a5b4fc" />
          <Text className="text-foreground text-sm">{label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color="#6b7280" />
      </Pressable>
    </Link>
  );
}
