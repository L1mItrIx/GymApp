import type { MuscleGroup } from "./types";

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: "Pecho",
  back: "Espalda (general)",
  lats: "Dorsales",
  traps: "Trapecio",
  front_delts: "Deltoides frontal",
  side_delts: "Deltoides lateral",
  rear_delts: "Deltoides posterior",
  biceps: "Bíceps",
  triceps: "Tríceps",
  forearms: "Antebrazos",
  quads: "Cuádriceps",
  hamstrings: "Femorales",
  glutes: "Glúteos",
  calves: "Gemelos",
  abs: "Abdominales",
};

export const MUSCLE_GROUPS_ORDER: MuscleGroup[] = [
  "chest",
  "back",
  "lats",
  "traps",
  "front_delts",
  "side_delts",
  "rear_delts",
  "biceps",
  "triceps",
  "forearms",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "abs",
];

export const MUSCLE_CATEGORIES: { label: string; muscles: MuscleGroup[] }[] = [
  { label: "Torso (empuje)", muscles: ["chest", "front_delts", "triceps"] },
  { label: "Torso (tirón)", muscles: ["back", "lats", "rear_delts", "biceps", "traps"] },
  { label: "Hombros", muscles: ["side_delts", "front_delts", "rear_delts"] },
  { label: "Tren inferior", muscles: ["quads", "hamstrings", "glutes", "calves"] },
  { label: "Core y accesorios", muscles: ["abs", "forearms"] },
];
