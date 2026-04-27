import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button, Card } from "@/components/ui";
import { useAuth } from "@/components/AuthGate";
import { applyTemplateToPlan, ensurePlan } from "@/lib/data";
import { TEMPLATES } from "@/lib/templates";
import { MUSCLE_LABELS } from "@/lib/muscles";
import type { MuscleGroup } from "@/lib/types";

const DAY_LABEL = ["L", "M", "X", "J", "V", "S", "D"];

const CUSTOM_OPTION = "custom";

interface OptionMeta {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string; // accent for the icon tile
  badge?: string; // top-right pill text
}

const TEMPLATE_META: Record<string, OptionMeta> = {
  "ppl-6": {
    id: "ppl-6",
    title: "Push / Pull / Legs",
    subtitle: "6 días · empuje, tirón y pierna 2× semana",
    icon: "barbell",
    color: "#a5b4fc",
    badge: "6 días",
  },
  "upper-lower-4": {
    id: "upper-lower-4",
    title: "Upper / Lower",
    subtitle: "4 días · tren superior e inferior 2× semana",
    icon: "swap-vertical",
    color: "#34d399",
    badge: "4 días",
  },
  "fullbody-3": {
    id: "fullbody-3",
    title: "Full Body",
    subtitle: "3 días · cuerpo completo, ideal para empezar",
    icon: "body",
    color: "#fbbf24",
    badge: "3 días",
  },
  "arnold-6": {
    id: "arnold-6",
    title: "Arnold Split",
    subtitle: "6 días · pecho+espalda, hombros+brazos, pierna",
    icon: "trophy",
    color: "#fb923c",
    badge: "6 días",
  },
};

const CUSTOM_META: OptionMeta = {
  id: CUSTOM_OPTION,
  title: "Crear mi propia",
  subtitle: "Configura tu agenda Lun→Dom desde cero",
  icon: "create",
  color: "#f472b6",
  badge: "Custom",
};

export default function RoutinesScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [planId, setPlanId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const p = await ensurePlan(session.user.id);
      setPlanId(p.id);
    })();
  }, [session]);

  const confirm = async () => {
    if (!selected) return;
    if (selected === CUSTOM_OPTION) {
      router.replace("/(app)/agenda");
      return;
    }
    if (!planId) return;
    const tpl = TEMPLATES.find((t) => t.id === selected);
    if (!tpl) return;

    Alert.alert(
      "Aplicar rutina",
      `Esto reemplazará tu agenda actual con "${tpl.name}". ¿Continuar?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Aplicar",
          style: "destructive",
          onPress: async () => {
            setApplying(true);
            try {
              await applyTemplateToPlan(planId, tpl.days);
              router.replace("/(app)/agenda");
            } finally {
              setApplying(false);
            }
          },
        },
      ]
    );
  };

  const selectedMeta =
    selected === CUSTOM_OPTION ? CUSTOM_META : selected ? TEMPLATE_META[selected] : null;

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerClassName="px-4 pt-5 gap-3"
        contentInset={{ bottom: 80 }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View>
          <View className="self-start flex-row items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
            <Ionicons name="sparkles" size={12} color="#fbbf24" />
            <Text className="text-amber-300 text-[11px]">Elige cómo entrenar</Text>
          </View>
          <Text className="text-foreground text-2xl font-bold mt-3">¿Qué rutina quieres?</Text>
          <Text className="text-neutral-400 text-sm mt-1">
            Selecciona una y la cargamos en tu agenda. Luego puedes editarla.
          </Text>
        </View>

        {TEMPLATES.map((tpl) => {
          const meta = TEMPLATE_META[tpl.id];
          if (!meta) return null;
          const isSel = selected === tpl.id;
          const totalSets = tpl.days.reduce(
            (acc, d) => acc + d.exercises.reduce((a, e) => a + e.sets, 0),
            0
          );
          return (
            <RoutineOption
              key={tpl.id}
              meta={meta}
              isSelected={isSel}
              onSelect={() => setSelected(tpl.id)}
            >
              <View className="flex-row gap-1 mt-3">
                {tpl.days.map((d, i) => (
                  <View
                    key={i}
                    className={[
                      "flex-1 py-1 rounded items-center",
                      d.isRest ? "bg-emerald-500/10" : "bg-indigo-500/10",
                    ].join(" ")}
                  >
                    <Text
                      className={[
                        "text-[10px]",
                        d.isRest ? "text-emerald-300" : "text-indigo-300",
                      ].join(" ")}
                    >
                      {DAY_LABEL[i]}
                    </Text>
                  </View>
                ))}
              </View>
              <Text className="text-neutral-500 text-[11px] mt-2">
                {tpl.daysPerWeek} días · {totalSets} series semanales
              </Text>

              <View className="gap-0.5 mt-2">
                {tpl.days
                  .filter((d) => !d.isRest)
                  .slice(0, 2)
                  .map((d) => (
                    <Text key={d.dayOfWeek} className="text-[11px]" numberOfLines={1}>
                      <Text className="text-indigo-300 font-medium">{d.name}</Text>
                      <Text className="text-neutral-500">
                        {" — "}
                        {(d.focus as MuscleGroup[])
                          .slice(0, 3)
                          .map((m) => MUSCLE_LABELS[m])
                          .join(", ")}
                      </Text>
                    </Text>
                  ))}
              </View>
            </RoutineOption>
          );
        })}

        {/* Custom option */}
        <RoutineOption
          meta={CUSTOM_META}
          isSelected={selected === CUSTOM_OPTION}
          onSelect={() => setSelected(CUSTOM_OPTION)}
        >
          <Text className="text-neutral-400 text-[11px] mt-2">
            Empieza con 7 días vacíos. Marca cada día como entreno o descanso, añade ejercicios, y la
            optimización se calcula sola.
          </Text>
        </RoutineOption>

        <View className="h-24" />
      </ScrollView>

      {/* Sticky bottom bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-surface border-t border-border px-4 pt-3 pb-5">
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            {selectedMeta ? (
              <>
                <Text className="text-neutral-500 text-[10px] uppercase tracking-wider">
                  Seleccionado
                </Text>
                <Text className="text-foreground text-sm font-semibold" numberOfLines={1}>
                  {selectedMeta.title}
                </Text>
              </>
            ) : (
              <Text className="text-neutral-500 text-xs">Selecciona una opción para continuar</Text>
            )}
          </View>
          <Pressable
            onPress={confirm}
            disabled={!selected || applying}
            className="shrink-0"
          >
            <Button disabled={!selected || applying}>
              <Text className="text-white text-sm font-semibold">
                {applying
                  ? "Aplicando..."
                  : selected === CUSTOM_OPTION
                  ? "Empezar"
                  : "Aplicar"}
              </Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </Button>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function RoutineOption({
  meta,
  isSelected,
  onSelect,
  children,
}: {
  meta: OptionMeta;
  isSelected: boolean;
  onSelect: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Pressable onPress={onSelect}>
      <Card
        className={[
          "border",
          isSelected ? "border-indigo-500" : "border-border",
        ].join(" ")}
      >
        <View className="flex-row items-start gap-3">
          {/* Icon "image" tile */}
          <View
            className="size-14 rounded-xl items-center justify-center"
            style={{ backgroundColor: `${meta.color}1F`, borderWidth: 1, borderColor: `${meta.color}40` }}
          >
            <Ionicons name={meta.icon} size={26} color={meta.color} />
          </View>

          <View className="flex-1">
            <View className="flex-row items-center justify-between gap-2">
              <Text className="text-foreground text-base font-semibold flex-1" numberOfLines={1}>
                {meta.title}
              </Text>
              {meta.badge && (
                <View
                  className="px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${meta.color}1F` }}
                >
                  <Text className="text-[10px]" style={{ color: meta.color }}>
                    {meta.badge}
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-neutral-400 text-xs mt-0.5">{meta.subtitle}</Text>
          </View>

          {/* Selector circle */}
          <View
            className={[
              "size-6 rounded-full items-center justify-center border-2",
              isSelected ? "border-indigo-400 bg-indigo-500" : "border-neutral-600 bg-transparent",
            ].join(" ")}
          >
            {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
        </View>

        {children}
      </Card>
    </Pressable>
  );
}
