import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MUSCLE_LABELS } from "@/lib/muscles";
import { STATUS_STYLES, VOLUME_LANDMARKS, type VolumeAssessment } from "@/lib/volume";

const ICON: Record<VolumeAssessment["status"], keyof typeof Ionicons.glyphMap> = {
  low: "trending-down",
  mev: "alert-circle-outline",
  optimal: "checkmark-circle",
  high: "flame",
  overload: "warning",
};

export function VolumeMeter({ assessments }: { assessments: VolumeAssessment[] }) {
  if (assessments.length === 0) {
    return (
      <Text className="text-neutral-500 italic text-sm">
        Añade ejercicios para ver el puntaje de volumen.
      </Text>
    );
  }

  return (
    <View className="gap-3">
      {assessments.map((a) => {
        const s = STATUS_STYLES[a.status];
        const landmarks = VOLUME_LANDMARKS[a.muscle];
        const max = landmarks.MRV + 6;
        const pct = Math.min(100, (a.sets / max) * 100);
        const mevPct = (landmarks.MEV / max) * 100;
        const mavStart = (landmarks.MAV[0] / max) * 100;
        const mavEnd = (landmarks.MAV[1] / max) * 100;
        const mrvPct = (landmarks.MRV / max) * 100;

        return (
          <View
            key={a.muscle}
            className={["rounded-lg p-3 border", s.bg, s.border].join(" ")}
          >
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-row items-center gap-2 flex-1">
                <Ionicons name={ICON[a.status]} size={16} color={s.barColor} />
                <Text className="text-foreground text-sm font-medium" numberOfLines={1}>
                  {MUSCLE_LABELS[a.muscle]}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-foreground text-sm font-semibold">{a.sets} series</Text>
                <Text className="text-neutral-400 text-[10px]">puntaje {a.score}/100</Text>
              </View>
            </View>

            <View className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
              <View
                className="absolute inset-y-0 bg-emerald-500/30"
                style={{ left: `${mavStart}%`, width: `${mavEnd - mavStart}%`, top: 0, bottom: 0 }}
              />
              <View
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${pct}%`,
                  backgroundColor: s.barColor,
                  opacity: 0.85,
                  top: 0,
                  bottom: 0,
                }}
              />
              <View
                className="absolute"
                style={{
                  left: `${mevPct}%`,
                  width: 1,
                  backgroundColor: "#fbbf24",
                  top: 0,
                  bottom: 0,
                }}
              />
              <View
                className="absolute"
                style={{
                  left: `${mrvPct}%`,
                  width: 1,
                  backgroundColor: "#f87171",
                  top: 0,
                  bottom: 0,
                }}
              />
            </View>

            <View className="flex-row justify-between mt-1.5">
              <Text className="text-neutral-500 text-[10px]">MEV {landmarks.MEV}</Text>
              <Text className="text-neutral-500 text-[10px]">
                MAV {landmarks.MAV[0]}–{landmarks.MAV[1]}
              </Text>
              <Text className="text-neutral-500 text-[10px]">MRV {landmarks.MRV}</Text>
            </View>

            <Text className={["mt-2 text-xs", s.text].join(" ")}>
              <Text className="font-semibold">{s.label}.</Text> {a.message}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
