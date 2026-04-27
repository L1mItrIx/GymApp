import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MUSCLE_LABELS } from "@/lib/muscles";
import type { OptimizationReport } from "@/lib/optimization";

const DAY_SHORT = ["L", "M", "X", "J", "V", "S", "D"];

const WARNING_ICON = {
  rest: "warning" as const,
  frequency: "alert-circle" as const,
  volume: "alert-circle" as const,
  distribution: "bar-chart" as const,
};

const WARNING_COLOR: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  rest:         { bg: "bg-red-500/10",    border: "border-red-500/30",    text: "text-red-300",    icon: "#f87171" },
  frequency:    { bg: "bg-amber-500/10",  border: "border-amber-500/30",  text: "text-amber-300",  icon: "#fbbf24" },
  volume:       { bg: "bg-amber-500/10",  border: "border-amber-500/30",  text: "text-amber-300",  icon: "#fbbf24" },
  distribution: { bg: "bg-sky-500/10",    border: "border-sky-500/30",    text: "text-sky-300",    icon: "#38bdf8" },
};

export function OptimizationPanel({ report }: { report: OptimizationReport }) {
  return (
    <View className="gap-4">
      <View>
        <View className="flex-row items-center justify-between">
          <Text className="text-foreground font-medium">Puntaje de optimización</Text>
          <Text className="text-indigo-300 text-2xl font-semibold">{report.score}/100</Text>
        </View>
        <View className="mt-2 h-2 rounded-full bg-white/5 overflow-hidden">
          <View
            className="h-full bg-indigo-500"
            style={{ width: `${report.score}%` }}
          />
        </View>
        <Text className="text-neutral-500 text-[10px] mt-1.5">
          Volumen ×0.35 · Descanso ×0.30 · Frecuencia ×0.20 · Distribución ×0.15
        </Text>
      </View>

      {report.warnings.length > 0 ? (
        <View className="gap-1.5">
          {report.warnings.map((w, i) => {
            const c = WARNING_COLOR[w.kind];
            return (
              <View
                key={i}
                className={["flex-row items-start gap-2 p-2.5 rounded-md border", c.bg, c.border].join(" ")}
              >
                <Ionicons name={WARNING_ICON[w.kind]} size={14} color={c.icon} />
                <Text className={["flex-1 text-xs", c.text].join(" ")}>{w.message}</Text>
              </View>
            );
          })}
        </View>
      ) : (
        <View className="flex-row items-start gap-2 p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/30">
          <Ionicons name="checkmark-circle" size={14} color="#34d399" />
          <Text className="flex-1 text-xs text-emerald-300">
            Tu agenda no tiene problemas detectados. Buen trabajo.
          </Text>
        </View>
      )}

      <View>
        <Text className="text-[10px] uppercase tracking-wider text-neutral-500 mb-2">
          Por músculo
        </Text>
        <View className="gap-1.5">
          {report.perMuscle.map((m) => {
            const restOk = m.frequency < 2 || m.minRestHours >= 48;
            return (
              <View key={m.muscle} className="p-2.5 rounded-md bg-surface-2 border border-border">
                <View className="flex-row items-center justify-between">
                  <Text className="text-foreground text-sm font-medium">
                    {MUSCLE_LABELS[m.muscle]}
                  </Text>
                  <Text className="text-neutral-300 text-xs">
                    {m.weeklySets} series · freq {m.frequency}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2 mt-1.5">
                  <View className="flex-row gap-0.5">
                    {DAY_SHORT.map((d, i) => (
                      <View
                        key={i}
                        className={[
                          "size-5 items-center justify-center rounded",
                          m.daysHit.includes(i) ? "bg-indigo-500/30" : "bg-white/5",
                        ].join(" ")}
                      >
                        <Text
                          className={[
                            "text-[9px]",
                            m.daysHit.includes(i) ? "text-indigo-200" : "text-neutral-600",
                          ].join(" ")}
                        >
                          {d}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <View className="ml-auto flex-row items-center gap-1">
                    {m.frequency < 2 ? (
                      <Text className="text-neutral-500 text-[10px]">—</Text>
                    ) : (
                      <>
                        <Text
                          className={[
                            "text-[10px]",
                            restOk ? "text-emerald-400" : "text-red-400",
                          ].join(" ")}
                        >
                          {Math.round(m.minRestHours)}h
                        </Text>
                        <Ionicons
                          name={restOk ? "checkmark" : "warning"}
                          size={10}
                          color={restOk ? "#34d399" : "#f87171"}
                        />
                      </>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
          {report.perMuscle.length === 0 && (
            <Text className="text-neutral-500 italic text-sm">
              Añade ejercicios a tu agenda para ver el análisis.
            </Text>
          )}
        </View>
      </View>

      <View>
        <Text className="text-[10px] uppercase tracking-wider text-neutral-500 mb-2">
          Distribución del volumen
        </Text>
        <View className="flex-row items-end gap-1 h-20">
          {Array.from({ length: 7 }, (_, dow) => {
            const day = report.distribution.setsPerTrainingDay.find((d) => d.dayOfWeek === dow);
            const max = Math.max(
              1,
              ...report.distribution.setsPerTrainingDay.map((d) => d.sets)
            );
            const pct = day ? (day.sets / max) * 100 : 0;
            return (
              <View key={dow} className="flex-1 items-center gap-1">
                <View className="flex-1 w-full justify-end">
                  <View
                    className="w-full rounded-t bg-indigo-500/40"
                    style={{ height: `${pct}%`, minHeight: day ? 2 : 0 }}
                  />
                </View>
                <Text className="text-neutral-500 text-[9px]">{DAY_SHORT[dow]}</Text>
              </View>
            );
          })}
        </View>
        <Text className="text-neutral-500 text-[10px] mt-2">
          CV {(report.distribution.cv * 100).toFixed(0)}% · puntaje{" "}
          {report.distribution.score}/100
        </Text>
      </View>
    </View>
  );
}
