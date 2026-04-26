import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, H1, Muted } from "@/components/ui";
import { useApp } from "@/lib/store";

export default function HomeScreen() {
  const profile = useApp((s) => s.profile);
  const hydrated = useApp((s) => s.hydrated);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const ready = mounted && hydrated;
  const ctaHref = ready && profile?.onboarded ? "/dashboard" : "/onboarding";
  const ctaLabel = ready && profile?.onboarded ? "Ir al dashboard" : "Comenzar";

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="px-5 py-8">
        <View className="items-center">
          <View className="size-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 items-center justify-center mb-4">
            <Ionicons name="barbell" size={32} color="#a5b4fc" />
          </View>
          <Text className="text-foreground text-3xl font-bold text-center">FitForge</Text>
          <Muted className="text-center mt-2 px-4">
            Diseña tus rutinas según las máquinas y poleas de tu gimnasio, con puntaje de volumen.
          </Muted>
        </View>

        <View className="mt-8 gap-3">
          <Link href={ctaHref as any} asChild>
            <Button>{ctaLabel}</Button>
          </Link>
          <Link href="/routines/new" asChild>
            <Button variant="secondary">Crear rutina ahora</Button>
          </Link>
        </View>

        <View className="mt-10 gap-3">
          <Card>
            <View className="flex-row items-center gap-3">
              <Ionicons name="locate" size={20} color="#a5b4fc" />
              <View className="flex-1">
                <Text className="text-foreground font-semibold">Enfoca el día</Text>
                <Muted className="mt-0.5 text-xs">
                  Elige uno o varios grupos musculares por día. Te sugerimos los mejores ejercicios.
                </Muted>
              </View>
            </View>
          </Card>

          <Card>
            <View className="flex-row items-center gap-3">
              <Ionicons name="list" size={20} color="#34d399" />
              <View className="flex-1">
                <Text className="text-foreground font-semibold">Personaliza todo</Text>
                <Muted className="mt-0.5 text-xs">
                  Añade, quita o ajusta series, reps y RIR. Cada rutina vive en un día de la semana.
                </Muted>
              </View>
            </View>
          </Card>

          <Card>
            <View className="flex-row items-center gap-3">
              <Ionicons name="speedometer" size={20} color="#fbbf24" />
              <View className="flex-1">
                <Text className="text-foreground font-semibold">Puntaje de volumen</Text>
                <Muted className="mt-0.5 text-xs">
                  Avisamos si tu volumen semanal queda por debajo del mínimo o por encima del máximo recuperable.
                </Muted>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
