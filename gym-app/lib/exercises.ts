import type { Exercise } from "./types";

export const EXERCISES: Exercise[] = [
  // Pecho
  { id: "bench-press", name: "Press de banca con barra", primary: "chest", secondary: ["front_delts", "triceps"], equipment: "barbell", compound: true },
  { id: "incline-bench-db", name: "Press inclinado con mancuernas", primary: "chest", secondary: ["front_delts", "triceps"], equipment: "dumbbell", compound: true },
  { id: "chest-press-machine", name: "Máquina de press de pecho", primary: "chest", secondary: ["front_delts", "triceps"], equipment: "machine", compound: true },
  { id: "pec-deck", name: "Máquina contractora (pec deck)", primary: "chest", secondary: [], equipment: "machine", compound: false },
  { id: "cable-crossover", name: "Cruce de poleas", primary: "chest", secondary: ["front_delts"], equipment: "cable", compound: false },
  { id: "dips", name: "Fondos en paralelas", primary: "chest", secondary: ["triceps", "front_delts"], equipment: "bodyweight", compound: true },

  // Espalda / Dorsales
  { id: "lat-pulldown", name: "Jalón al pecho (polea)", primary: "lats", secondary: ["biceps", "rear_delts"], equipment: "cable", compound: true },
  { id: "pullup", name: "Dominadas", primary: "lats", secondary: ["biceps", "rear_delts"], equipment: "bodyweight", compound: true },
  { id: "seated-row-machine", name: "Remo sentado en máquina", primary: "back", secondary: ["lats", "biceps", "rear_delts"], equipment: "machine", compound: true },
  { id: "cable-row", name: "Remo en polea baja", primary: "back", secondary: ["lats", "biceps"], equipment: "cable", compound: true },
  { id: "barbell-row", name: "Remo con barra", primary: "back", secondary: ["lats", "biceps", "rear_delts"], equipment: "barbell", compound: true },
  { id: "t-bar-row", name: "Remo T", primary: "back", secondary: ["lats", "biceps"], equipment: "machine", compound: true },
  { id: "straight-arm-pulldown", name: "Pullover en polea", primary: "lats", secondary: [], equipment: "cable", compound: false },

  // Hombros
  { id: "overhead-press", name: "Press militar con barra", primary: "front_delts", secondary: ["side_delts", "triceps"], equipment: "barbell", compound: true },
  { id: "shoulder-press-machine", name: "Máquina de press de hombro", primary: "front_delts", secondary: ["side_delts", "triceps"], equipment: "machine", compound: true },
  { id: "db-shoulder-press", name: "Press hombro con mancuernas", primary: "front_delts", secondary: ["side_delts", "triceps"], equipment: "dumbbell", compound: true },
  { id: "lateral-raise-db", name: "Elevaciones laterales con mancuernas", primary: "side_delts", secondary: [], equipment: "dumbbell", compound: false },
  { id: "lateral-raise-cable", name: "Elevaciones laterales en polea", primary: "side_delts", secondary: [], equipment: "cable", compound: false },
  { id: "lateral-raise-machine", name: "Máquina de elevaciones laterales", primary: "side_delts", secondary: [], equipment: "machine", compound: false },
  { id: "rear-delt-fly-machine", name: "Pájaros en máquina (rear delt)", primary: "rear_delts", secondary: ["traps"], equipment: "machine", compound: false },
  { id: "face-pull", name: "Face pull en polea", primary: "rear_delts", secondary: ["traps"], equipment: "cable", compound: false },
  { id: "reverse-pec-deck", name: "Pec deck invertido", primary: "rear_delts", secondary: [], equipment: "machine", compound: false },

  // Trapecio
  { id: "shrugs-db", name: "Encogimientos con mancuernas", primary: "traps", secondary: [], equipment: "dumbbell", compound: false },
  { id: "shrugs-machine", name: "Encogimientos en máquina", primary: "traps", secondary: [], equipment: "machine", compound: false },
  { id: "upright-row-cable", name: "Remo al mentón en polea", primary: "traps", secondary: ["side_delts"], equipment: "cable", compound: false },

  // Bíceps
  { id: "barbell-curl", name: "Curl con barra", primary: "biceps", secondary: ["forearms"], equipment: "barbell", compound: false },
  { id: "db-curl", name: "Curl con mancuernas", primary: "biceps", secondary: ["forearms"], equipment: "dumbbell", compound: false },
  { id: "preacher-curl-machine", name: "Curl en máquina predicador", primary: "biceps", secondary: [], equipment: "machine", compound: false },
  { id: "hammer-curl", name: "Curl martillo", primary: "biceps", secondary: ["forearms"], equipment: "dumbbell", compound: false },
  { id: "cable-curl", name: "Curl en polea", primary: "biceps", secondary: [], equipment: "cable", compound: false },

  // Tríceps
  { id: "tricep-pushdown", name: "Extensiones tríceps en polea", primary: "triceps", secondary: [], equipment: "cable", compound: false },
  { id: "tricep-rope", name: "Tríceps con cuerda", primary: "triceps", secondary: [], equipment: "cable", compound: false },
  { id: "overhead-tricep-cable", name: "Extensión tríceps sobre cabeza (polea)", primary: "triceps", secondary: [], equipment: "cable", compound: false },
  { id: "skullcrusher", name: "Francés con barra EZ", primary: "triceps", secondary: [], equipment: "barbell", compound: false },
  { id: "tricep-dip-machine", name: "Máquina de fondos", primary: "triceps", secondary: ["chest", "front_delts"], equipment: "machine", compound: true },

  // Antebrazos
  { id: "wrist-curl", name: "Curl de muñeca", primary: "forearms", secondary: [], equipment: "dumbbell", compound: false },
  { id: "reverse-wrist-curl", name: "Curl de muñeca inverso", primary: "forearms", secondary: [], equipment: "dumbbell", compound: false },
  { id: "farmer-walk", name: "Paseo del granjero", primary: "forearms", secondary: ["traps"], equipment: "dumbbell", compound: false },

  // Cuádriceps
  { id: "back-squat", name: "Sentadilla con barra", primary: "quads", secondary: ["glutes", "hamstrings"], equipment: "barbell", compound: true },
  { id: "leg-press", name: "Prensa de piernas", primary: "quads", secondary: ["glutes", "hamstrings"], equipment: "machine", compound: true },
  { id: "hack-squat", name: "Hack squat en máquina", primary: "quads", secondary: ["glutes"], equipment: "machine", compound: true },
  { id: "leg-extension", name: "Extensión de cuádriceps", primary: "quads", secondary: [], equipment: "machine", compound: false },
  { id: "bulgarian-split-squat", name: "Sentadilla búlgara", primary: "quads", secondary: ["glutes", "hamstrings"], equipment: "dumbbell", compound: true },
  { id: "smith-squat", name: "Sentadilla en Smith", primary: "quads", secondary: ["glutes"], equipment: "smith", compound: true },

  // Femorales
  { id: "romanian-deadlift", name: "Peso muerto rumano", primary: "hamstrings", secondary: ["glutes", "back"], equipment: "barbell", compound: true },
  { id: "leg-curl-lying", name: "Curl femoral tumbado", primary: "hamstrings", secondary: [], equipment: "machine", compound: false },
  { id: "leg-curl-seated", name: "Curl femoral sentado", primary: "hamstrings", secondary: [], equipment: "machine", compound: false },
  { id: "good-morning", name: "Buenos días con barra", primary: "hamstrings", secondary: ["glutes", "back"], equipment: "barbell", compound: true },

  // Glúteos
  { id: "hip-thrust", name: "Hip thrust con barra", primary: "glutes", secondary: ["hamstrings"], equipment: "barbell", compound: true },
  { id: "hip-thrust-machine", name: "Hip thrust en máquina", primary: "glutes", secondary: ["hamstrings"], equipment: "machine", compound: true },
  { id: "cable-kickback", name: "Patadas de glúteo en polea", primary: "glutes", secondary: ["hamstrings"], equipment: "cable", compound: false },
  { id: "abductor-machine", name: "Máquina de abductores", primary: "glutes", secondary: [], equipment: "machine", compound: false },

  // Gemelos
  { id: "standing-calf-raise", name: "Gemelos de pie (máquina)", primary: "calves", secondary: [], equipment: "machine", compound: false },
  { id: "seated-calf-raise", name: "Gemelos sentado (máquina)", primary: "calves", secondary: [], equipment: "machine", compound: false },
  { id: "calf-press-leg-press", name: "Gemelos en prensa", primary: "calves", secondary: [], equipment: "machine", compound: false },

  // Abdominales
  { id: "cable-crunch", name: "Crunch en polea", primary: "abs", secondary: [], equipment: "cable", compound: false },
  { id: "hanging-leg-raise", name: "Elevaciones de piernas colgado", primary: "abs", secondary: [], equipment: "bodyweight", compound: false },
  { id: "ab-machine", name: "Máquina de abdominales", primary: "abs", secondary: [], equipment: "machine", compound: false },
  { id: "plank", name: "Plancha", primary: "abs", secondary: [], equipment: "bodyweight", compound: false },
];

export function exerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}

export function exercisesForMuscles(muscles: string[]): Exercise[] {
  const set = new Set(muscles);
  return EXERCISES.filter(
    (e) => set.has(e.primary) || e.secondary.some((s) => set.has(s))
  );
}
