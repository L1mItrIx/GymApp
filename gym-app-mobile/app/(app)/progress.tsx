import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, useFocusEffect } from "expo-router";
import { Card } from "@/components/ui";
import { useAuth } from "@/components/AuthGate";
import { listSessionDates } from "@/lib/data";

const DAY_HEADERS = ["L", "M", "X", "J", "V", "S", "D"];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function iso(d: Date) {
  const tz = d.getTimezoneOffset();
  return new Date(d.getTime() - tz * 60_000).toISOString().slice(0, 10);
}

export default function ProgressScreen() {
  const { session } = useAuth();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [sessionDates, setSessionDates] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!session) return;
    const start = iso(startOfMonth(cursor));
    const end = iso(endOfMonth(cursor));
    const dates = await listSessionDates(session.user.id, start, end);
    setSessionDates(new Set(dates));
  }, [session, cursor]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const grid = useMemo(() => buildMonthGrid(cursor), [cursor]);
  const todayISO = iso(new Date());

  return (
    <ScrollView contentContainerClassName="px-4 py-5 gap-4" className="bg-background">
      <View>
        <Text className="text-foreground text-2xl font-bold">Progreso</Text>
        <Text className="text-neutral-400 text-sm mt-1">
          Selecciona un día para registrar o revisar tu sesión.
        </Text>
      </View>

      <Card>
        <View className="flex-row items-center justify-between mb-3">
          <Pressable
            onPress={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={18} color="#9ca3af" />
          </Pressable>
          <Text className="text-foreground text-sm font-medium capitalize">
            {cursor.toLocaleDateString("es", { month: "long", year: "numeric" })}
          </Text>
          <Pressable
            onPress={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
            hitSlop={8}
          >
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </Pressable>
        </View>

        <View className="flex-row gap-1 mb-1.5">
          {DAY_HEADERS.map((d) => (
            <View key={d} className="flex-1 items-center">
              <Text className="text-neutral-500 text-[10px]">{d}</Text>
            </View>
          ))}
        </View>

        <View className="gap-1">
          {Array.from({ length: grid.length / 7 }, (_, weekIdx) => (
            <View key={weekIdx} className="flex-row gap-1">
              {grid.slice(weekIdx * 7, weekIdx * 7 + 7).map((cell, i) => {
                const dateISO = iso(cell.date);
                const has = sessionDates.has(dateISO);
                const isToday = dateISO === todayISO;
                return (
                  <Link key={i} href={`/(app)/progress/${dateISO}` as any} asChild>
                    <Pressable
                      className={[
                        "flex-1 aspect-square rounded-md items-center justify-center",
                        cell.inMonth ? "" : "opacity-30",
                        isToday
                          ? "bg-indigo-500/10 border border-indigo-500/40"
                          : has
                          ? "bg-emerald-500/15 border border-emerald-500/30"
                          : "border border-transparent active:bg-white/5",
                      ].join(" ")}
                    >
                      <Text
                        className={[
                          "text-sm",
                          isToday
                            ? "text-indigo-200 font-semibold"
                            : has
                            ? "text-emerald-300"
                            : "text-neutral-300",
                        ].join(" ")}
                      >
                        {cell.date.getDate()}
                      </Text>
                      {has && <View className="size-1 rounded-full bg-emerald-400 mt-0.5" />}
                    </Pressable>
                  </Link>
                );
              })}
            </View>
          ))}
        </View>
      </Card>

      <Text className="text-neutral-500 text-[11px] text-center">
        Días en verde = sesiones registradas. Toca un día para ver detalles.
      </Text>

      <View className="h-8" />
    </ScrollView>
  );
}

function buildMonthGrid(cursor: Date): { date: Date; inMonth: boolean }[] {
  const first = startOfMonth(cursor);
  const last = endOfMonth(cursor);
  const firstWeekday = (first.getDay() + 6) % 7;
  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < firstWeekday; i++) {
    const d = new Date(first);
    d.setDate(d.getDate() - (firstWeekday - i));
    cells.push({ date: d, inMonth: false });
  }
  for (let day = 1; day <= last.getDate(); day++) {
    cells.push({ date: new Date(cursor.getFullYear(), cursor.getMonth(), day), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const lastCell = cells[cells.length - 1].date;
    const d = new Date(lastCell);
    d.setDate(d.getDate() + 1);
    cells.push({ date: d, inMonth: false });
  }
  return cells;
}
