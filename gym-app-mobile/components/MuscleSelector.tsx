import { Pressable, Text, View } from "react-native";
import { MUSCLE_CATEGORIES, MUSCLE_LABELS } from "@/lib/muscles";
import type { MuscleGroup } from "@/lib/types";

export function MuscleSelector({
  value,
  onChange,
}: {
  value: MuscleGroup[];
  onChange: (next: MuscleGroup[]) => void;
}) {
  const toggle = (m: MuscleGroup) => {
    onChange(value.includes(m) ? value.filter((x) => x !== m) : [...value, m]);
  };

  const seen = new Set<MuscleGroup>();

  return (
    <View className="gap-4">
      {MUSCLE_CATEGORIES.map((cat) => {
        const muscles = cat.muscles.filter((m) => !seen.has(m));
        muscles.forEach((m) => seen.add(m));
        if (muscles.length === 0) return null;
        return (
          <View key={cat.label}>
            <Text className="text-[10px] uppercase tracking-wider text-neutral-500 mb-2">
              {cat.label}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {muscles.map((m) => {
                const active = value.includes(m);
                return (
                  <Pressable
                    key={m}
                    onPress={() => toggle(m)}
                    className={[
                      "px-3 py-1.5 rounded-full border",
                      active
                        ? "bg-indigo-500/20 border-indigo-500/40"
                        : "bg-surface-2 border-border",
                    ].join(" ")}
                  >
                    <Text
                      className={[
                        "text-xs",
                        active ? "text-indigo-200" : "text-neutral-300",
                      ].join(" ")}
                    >
                      {MUSCLE_LABELS[m]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}
