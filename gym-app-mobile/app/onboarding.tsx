import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button, Card, Input, Label } from "@/components/ui";
import { ensurePlan, getProfile, upsertProfile, type ProfileRow } from "@/lib/data";
import { useAuth } from "@/components/AuthGate";

type Goal = ProfileRow["goal"];
type ExperienceLevel = ProfileRow["experience"];

const GOALS: { id: Goal; label: string; desc: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: "hypertrophy",     label: "Ganar masa muscular", desc: "Volumen medio-alto, 8-15 reps", icon: "flame" },
  { id: "strength",        label: "Fuerza",               desc: "Series pesadas, 3-6 reps",     icon: "trophy" },
  { id: "weight_loss",     label: "Perder peso",          desc: "Circuitos, gasto calórico",    icon: "scale" },
  { id: "endurance",       label: "Resistencia",          desc: "15+ reps, descansos cortos",   icon: "heart" },
  { id: "general_fitness", label: "Estado físico",        desc: "Rutinas equilibradas",         icon: "pulse" },
];

const EXPERIENCES: { id: ExperienceLevel; label: string }[] = [
  { id: "beginner", label: "Principiante (0-1 año)" },
  { id: "intermediate", label: "Intermedio (1-3 años)" },
  { id: "advanced", label: "Avanzado (3+ años)" },
];

const DAYS_OPTIONS = [2, 3, 4, 5, 6];

export default function OnboardingScreen() {
  const router = useRouter();
  const { session } = useAuth();

  const [name, setName] = useState("");
  const [goal, setGoal] = useState<Goal>("hypertrophy");
  const [experience, setExperience] = useState<ExperienceLevel>("beginner");
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      router.replace("/(auth)/login");
      return;
    }
    (async () => {
      const existing = await getProfile(session.user.id).catch(() => null);
      if (existing) {
        router.replace("/(app)/today");
        return;
      }
      if (session.user.user_metadata?.full_name) {
        setName(session.user.user_metadata.full_name as string);
      } else if (session.user.email) {
        setName(session.user.email.split("@")[0]);
      }
    })();
  }, [session, router]);

  const submit = async () => {
    if (!session || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await upsertProfile({
        id: session.user.id,
        name: name.trim(),
        goal,
        experience,
        days_per_week: daysPerWeek,
      });
      await ensurePlan(session.user.id);
      router.replace("/(app)/today");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerClassName="px-5 py-6 gap-5" className="bg-background">
      <View>
        <Text className="text-foreground text-xl font-semibold">Vamos a conocerte</Text>
        <Text className="text-neutral-400 mt-1">
          Esto nos ayuda a personalizar las recomendaciones.
        </Text>
      </View>

      <Card className="gap-1">
        <Label>¿Cómo te llamamos?</Label>
        <Input value={name} onChangeText={setName} placeholder="Tu nombre" />
      </Card>

      <Card className="gap-2">
        <Label>¿Cuál es tu objetivo principal?</Label>
        <View className="gap-2">
          {GOALS.map((g) => {
            const active = goal === g.id;
            return (
              <Pressable
                key={g.id}
                onPress={() => setGoal(g.id)}
                className={[
                  "flex-row items-center gap-3 p-3 rounded-lg border",
                  active ? "bg-indigo-500/10 border-indigo-500/40" : "bg-surface-2 border-border",
                ].join(" ")}
              >
                <View
                  className={[
                    "size-9 rounded-md items-center justify-center",
                    active ? "bg-indigo-500/20" : "bg-white/5",
                  ].join(" ")}
                >
                  <Ionicons name={g.icon} size={16} color={active ? "#a5b4fc" : "#9ca3af"} />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground text-sm font-medium">{g.label}</Text>
                  <Text className="text-neutral-400 text-xs mt-0.5">{g.desc}</Text>
                </View>
                {active && <Ionicons name="checkmark-circle" size={18} color="#a5b4fc" />}
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card className="gap-3">
        <View>
          <Label>Nivel de experiencia</Label>
          <View className="gap-1.5">
            {EXPERIENCES.map((e) => {
              const active = experience === e.id;
              return (
                <Pressable
                  key={e.id}
                  onPress={() => setExperience(e.id)}
                  className={[
                    "px-3 py-2 rounded-md border",
                    active ? "bg-indigo-500/15 border-indigo-500/40" : "bg-surface-2 border-border",
                  ].join(" ")}
                >
                  <Text className={["text-sm", active ? "text-indigo-200" : "text-foreground"].join(" ")}>
                    {e.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View>
          <Label>Días por semana</Label>
          <View className="flex-row gap-1.5">
            {DAYS_OPTIONS.map((n) => {
              const active = daysPerWeek === n;
              return (
                <Pressable
                  key={n}
                  onPress={() => setDaysPerWeek(n)}
                  className={[
                    "flex-1 py-2 rounded-md border items-center",
                    active ? "bg-indigo-500/15 border-indigo-500/40" : "bg-surface-2 border-border",
                  ].join(" ")}
                >
                  <Text className={["text-sm font-medium", active ? "text-indigo-200" : "text-foreground"].join(" ")}>
                    {n}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Card>

      {error && <Text className="text-red-400 text-xs px-1">{error}</Text>}

      <Button onPress={submit} disabled={!name.trim() || saving}>
        {saving ? "Guardando..." : "Continuar"}
      </Button>

      <View className="h-8" />
    </ScrollView>
  );
}
