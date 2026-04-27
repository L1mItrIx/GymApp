import AsyncStorage from "@react-native-async-storage/async-storage";

export type WeightUnit = "kg" | "lb";
export type WeekStart = "monday" | "sunday";

const KEYS = {
  weightUnit: "fitforge.weight_unit",
  weekStart: "fitforge.week_start",
};

export async function getWeightUnit(): Promise<WeightUnit> {
  const v = await AsyncStorage.getItem(KEYS.weightUnit);
  return v === "lb" ? "lb" : "kg";
}

export async function setWeightUnit(v: WeightUnit): Promise<void> {
  await AsyncStorage.setItem(KEYS.weightUnit, v);
}

export async function getWeekStart(): Promise<WeekStart> {
  const v = await AsyncStorage.getItem(KEYS.weekStart);
  return v === "sunday" ? "sunday" : "monday";
}

export async function setWeekStart(v: WeekStart): Promise<void> {
  await AsyncStorage.setItem(KEYS.weekStart, v);
}
