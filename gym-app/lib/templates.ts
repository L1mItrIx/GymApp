import type { MuscleGroup } from "./types";

export interface TemplateDay {
  dayOfWeek: number; // 0=Mon
  isRest: boolean;
  name: string | null;
  focus: MuscleGroup[];
  exercises: { exerciseId: string; sets: number; reps: string; rir?: number }[];
}

export interface PlanTemplate {
  id: string;
  name: string;
  description: string;
  daysPerWeek: number;
  days: TemplateDay[];
}

const REST = (d: number): TemplateDay => ({
  dayOfWeek: d,
  isRest: true,
  name: null,
  focus: [],
  exercises: [],
});

export const TEMPLATES: PlanTemplate[] = [
  {
    id: "ppl-6",
    name: "Push / Pull / Legs (6 días)",
    description:
      "Empuje, tirón y pierna repetidos dos veces por semana. Frecuencia 2 para todos los músculos grandes y descanso de 48 h.",
    daysPerWeek: 6,
    days: [
      {
        dayOfWeek: 0,
        isRest: false,
        name: "Push",
        focus: ["chest", "front_delts", "side_delts", "triceps"],
        exercises: [
          { exerciseId: "bench-press", sets: 3, reps: "6-8", rir: 2 },
          { exerciseId: "incline-bench-db", sets: 3, reps: "8-10", rir: 2 },
          { exerciseId: "shoulder-press-machine", sets: 3, reps: "8-10", rir: 2 },
          { exerciseId: "lateral-raise-cable", sets: 3, reps: "12-15", rir: 1 },
          { exerciseId: "tricep-pushdown", sets: 3, reps: "10-12", rir: 1 },
        ],
      },
      {
        dayOfWeek: 1,
        isRest: false,
        name: "Pull",
        focus: ["back", "lats", "rear_delts", "biceps"],
        exercises: [
          { exerciseId: "lat-pulldown", sets: 3, reps: "8-10", rir: 2 },
          { exerciseId: "seated-row-machine", sets: 3, reps: "8-10", rir: 2 },
          { exerciseId: "face-pull", sets: 3, reps: "12-15", rir: 1 },
          { exerciseId: "barbell-curl", sets: 3, reps: "8-10", rir: 1 },
          { exerciseId: "hammer-curl", sets: 2, reps: "10-12", rir: 1 },
        ],
      },
      {
        dayOfWeek: 2,
        isRest: false,
        name: "Legs",
        focus: ["quads", "hamstrings", "glutes", "calves"],
        exercises: [
          { exerciseId: "back-squat", sets: 3, reps: "6-8", rir: 2 },
          { exerciseId: "romanian-deadlift", sets: 3, reps: "8-10", rir: 2 },
          { exerciseId: "leg-press", sets: 3, reps: "10-12", rir: 1 },
          { exerciseId: "leg-curl-lying", sets: 3, reps: "10-12", rir: 1 },
          { exerciseId: "standing-calf-raise", sets: 4, reps: "10-12", rir: 1 },
        ],
      },
      {
        dayOfWeek: 3,
        isRest: false,
        name: "Push",
        focus: ["chest", "front_delts", "side_delts", "triceps"],
        exercises: [
          { exerciseId: "incline-bench-db", sets: 3, reps: "8-10", rir: 2 },
          { exerciseId: "chest-press-machine", sets: 3, reps: "10-12", rir: 1 },
          { exerciseId: "lateral-raise-machine", sets: 4, reps: "12-15", rir: 1 },
          { exerciseId: "overhead-tricep-cable", sets: 3, reps: "10-12", rir: 1 },
        ],
      },
      {
        dayOfWeek: 4,
        isRest: false,
        name: "Pull",
        focus: ["back", "lats", "rear_delts", "biceps"],
        exercises: [
          { exerciseId: "pullup", sets: 3, reps: "6-10", rir: 2 },
          { exerciseId: "cable-row", sets: 3, reps: "8-10", rir: 2 },
          { exerciseId: "rear-delt-fly-machine", sets: 3, reps: "12-15", rir: 1 },
          { exerciseId: "preacher-curl-machine", sets: 3, reps: "10-12", rir: 1 },
        ],
      },
      {
        dayOfWeek: 5,
        isRest: false,
        name: "Legs",
        focus: ["quads", "hamstrings", "glutes", "calves"],
        exercises: [
          { exerciseId: "hack-squat", sets: 3, reps: "8-10", rir: 2 },
          { exerciseId: "leg-extension", sets: 3, reps: "12-15", rir: 1 },
          { exerciseId: "leg-curl-seated", sets: 3, reps: "10-12", rir: 1 },
          { exerciseId: "hip-thrust-machine", sets: 3, reps: "10-12", rir: 1 },
          { exerciseId: "seated-calf-raise", sets: 4, reps: "10-12", rir: 1 },
        ],
      },
      REST(6),
    ],
  },
  {
    id: "upper-lower-4",
    name: "Upper / Lower (4 días)",
    description:
      "Tren superior y tren inferior dos veces por semana. Frecuencia 2 con 48 h de descanso garantizadas.",
    daysPerWeek: 4,
    days: [
      {
        dayOfWeek: 0,
        isRest: false,
        name: "Upper",
        focus: ["chest", "back", "lats", "side_delts", "biceps", "triceps"],
        exercises: [
          { exerciseId: "bench-press", sets: 3, reps: "6-8", rir: 2 },
          { exerciseId: "barbell-row", sets: 3, reps: "8-10", rir: 2 },
          { exerciseId: "shoulder-press-machine", sets: 3, reps: "8-10", rir: 2 },
          { exerciseId: "lat-pulldown", sets: 3, reps: "8-10", rir: 2 },
          { exerciseId: "barbell-curl", sets: 2, reps: "8-10", rir: 1 },
          { exerciseId: "tricep-pushdown", sets: 2, reps: "10-12", rir: 1 },
        ],
      },
      {
        dayOfWeek: 1,
        isRest: false,
        name: "Lower",
        focus: ["quads", "hamstrings", "glutes", "calves"],
        exercises: [
          { exerciseId: "back-squat", sets: 3, reps: "6-8", rir: 2 },
          { exerciseId: "romanian-deadlift", sets: 3, reps: "8-10", rir: 2 },
          { exerciseId: "leg-press", sets: 3, reps: "10-12", rir: 1 },
          { exerciseId: "leg-curl-lying", sets: 3, reps: "10-12", rir: 1 },
          { exerciseId: "standing-calf-raise", sets: 4, reps: "10-12", rir: 1 },
        ],
      },
      REST(2),
      {
        dayOfWeek: 3,
        isRest: false,
        name: "Upper",
        focus: ["chest", "back", "lats", "side_delts", "biceps", "triceps"],
        exercises: [
          { exerciseId: "incline-bench-db", sets: 3, reps: "8-10", rir: 2 },
          { exerciseId: "cable-row", sets: 3, reps: "8-10", rir: 2 },
          { exerciseId: "lateral-raise-cable", sets: 3, reps: "12-15", rir: 1 },
          { exerciseId: "pullup", sets: 3, reps: "6-10", rir: 2 },
          { exerciseId: "hammer-curl", sets: 2, reps: "10-12", rir: 1 },
          { exerciseId: "overhead-tricep-cable", sets: 2, reps: "10-12", rir: 1 },
        ],
      },
      {
        dayOfWeek: 4,
        isRest: false,
        name: "Lower",
        focus: ["quads", "hamstrings", "glutes", "calves"],
        exercises: [
          { exerciseId: "hack-squat", sets: 3, reps: "8-10", rir: 2 },
          { exerciseId: "hip-thrust", sets: 3, reps: "8-10", rir: 2 },
          { exerciseId: "leg-extension", sets: 3, reps: "12-15", rir: 1 },
          { exerciseId: "leg-curl-seated", sets: 3, reps: "10-12", rir: 1 },
          { exerciseId: "seated-calf-raise", sets: 4, reps: "10-12", rir: 1 },
        ],
      },
      REST(5),
      REST(6),
    ],
  },
  {
    id: "fullbody-3",
    name: "Full Body (3 días)",
    description:
      "Cuerpo completo en cada sesión, ideal para principiantes. Frecuencia 2-3 con 48 h de descanso.",
    daysPerWeek: 3,
    days: [
      {
        dayOfWeek: 0,
        isRest: false,
        name: "Full Body A",
        focus: ["chest", "back", "lats", "quads", "side_delts", "biceps"],
        exercises: [
          { exerciseId: "back-squat", sets: 3, reps: "6-8", rir: 2 },
          { exerciseId: "bench-press", sets: 3, reps: "6-8", rir: 2 },
          { exerciseId: "lat-pulldown", sets: 3, reps: "8-10", rir: 2 },
          { exerciseId: "lateral-raise-db", sets: 3, reps: "12-15", rir: 1 },
          { exerciseId: "barbell-curl", sets: 2, reps: "10-12", rir: 1 },
        ],
      },
      REST(1),
      {
        dayOfWeek: 2,
        isRest: false,
        name: "Full Body B",
        focus: ["hamstrings", "glutes", "chest", "back", "triceps", "calves"],
        exercises: [
          { exerciseId: "romanian-deadlift", sets: 3, reps: "8-10", rir: 2 },
          { exerciseId: "incline-bench-db", sets: 3, reps: "8-10", rir: 2 },
          { exerciseId: "seated-row-machine", sets: 3, reps: "8-10", rir: 2 },
          { exerciseId: "leg-press", sets: 3, reps: "10-12", rir: 1 },
          { exerciseId: "tricep-pushdown", sets: 3, reps: "10-12", rir: 1 },
          { exerciseId: "standing-calf-raise", sets: 3, reps: "10-12", rir: 1 },
        ],
      },
      REST(3),
      {
        dayOfWeek: 4,
        isRest: false,
        name: "Full Body C",
        focus: ["quads", "chest", "back", "lats", "rear_delts", "biceps"],
        exercises: [
          { exerciseId: "leg-press", sets: 3, reps: "10-12", rir: 1 },
          { exerciseId: "leg-curl-lying", sets: 3, reps: "10-12", rir: 1 },
          { exerciseId: "chest-press-machine", sets: 3, reps: "8-10", rir: 2 },
          { exerciseId: "cable-row", sets: 3, reps: "8-10", rir: 2 },
          { exerciseId: "face-pull", sets: 3, reps: "12-15", rir: 1 },
          { exerciseId: "hammer-curl", sets: 2, reps: "10-12", rir: 1 },
        ],
      },
      REST(5),
      REST(6),
    ],
  },
];

export function templateById(id: string) {
  return TEMPLATES.find((t) => t.id === id);
}
