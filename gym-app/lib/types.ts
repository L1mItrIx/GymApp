export type Goal =
  | "hypertrophy"
  | "strength"
  | "weight_loss"
  | "endurance"
  | "general_fitness";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export type MuscleGroup =
  | "chest"
  | "back"
  | "lats"
  | "traps"
  | "front_delts"
  | "side_delts"
  | "rear_delts"
  | "biceps"
  | "triceps"
  | "forearms"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "abs";

export type EquipmentType =
  | "machine"
  | "cable"
  | "barbell"
  | "dumbbell"
  | "bodyweight"
  | "smith"
  | "kettlebell";

export interface Exercise {
  id: string;
  name: string;
  primary: MuscleGroup;
  secondary: MuscleGroup[];
  equipment: EquipmentType;
  compound: boolean;
}

export interface RoutineExercise {
  exerciseId: string;
  sets: number;
  reps: string;
  rir?: number;
  notes?: string;
}

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface Routine {
  id: string;
  name: string;
  day: DayOfWeek;
  focus: MuscleGroup[];
  exercises: RoutineExercise[];
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  name: string;
  goal: Goal;
  experience: ExperienceLevel;
  daysPerWeek: number;
  onboarded: boolean;
}
