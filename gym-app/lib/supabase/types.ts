export type DayOfWeekIdx = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          goal: "hypertrophy" | "strength" | "weight_loss" | "endurance" | "general_fitness";
          experience: "beginner" | "intermediate" | "advanced";
          days_per_week: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      plans: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: { id?: string; user_id: string; name: string; is_active?: boolean };
        Update: Partial<{ name: string; is_active: boolean }>;
      };
      plan_days: {
        Row: {
          id: string;
          plan_id: string;
          day_of_week: number;
          is_rest: boolean;
          name: string | null;
          focus: string[];
        };
        Insert: { id?: string; plan_id: string; day_of_week: number; is_rest?: boolean; name?: string | null; focus?: string[] };
        Update: Partial<{ is_rest: boolean; name: string | null; focus: string[] }>;
      };
      plan_exercises: {
        Row: {
          id: string;
          plan_day_id: string;
          exercise_id: string;
          sets: number;
          reps: string;
          rir: number | null;
          notes: string | null;
          position: number;
        };
        Insert: { id?: string; plan_day_id: string; exercise_id: string; sets?: number; reps?: string; rir?: number | null; notes?: string | null; position?: number };
        Update: Partial<{ sets: number; reps: string; rir: number | null; notes: string | null; position: number }>;
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          plan_day_id: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: { id?: string; user_id: string; date: string; plan_day_id?: string | null; notes?: string | null };
        Update: Partial<{ plan_day_id: string | null; notes: string | null }>;
      };
      session_exercises: {
        Row: {
          id: string;
          session_id: string;
          exercise_id: string;
          position: number;
        };
        Insert: { id?: string; session_id: string; exercise_id: string; position?: number };
        Update: Partial<{ position: number }>;
      };
      set_logs: {
        Row: {
          id: string;
          session_exercise_id: string;
          set_number: number;
          weight_kg: number | null;
          reps: number | null;
          rir: number | null;
        };
        Insert: { id?: string; session_exercise_id: string; set_number: number; weight_kg?: number | null; reps?: number | null; rir?: number | null };
        Update: Partial<{ weight_kg: number | null; reps: number | null; rir: number | null }>;
      };
    };
  };
}

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type PlanRow = Database["public"]["Tables"]["plans"]["Row"];
export type PlanDayRow = Database["public"]["Tables"]["plan_days"]["Row"];
export type PlanExerciseRow = Database["public"]["Tables"]["plan_exercises"]["Row"];
export type WorkoutSessionRow = Database["public"]["Tables"]["workout_sessions"]["Row"];
export type SessionExerciseRow = Database["public"]["Tables"]["session_exercises"]["Row"];
export type SetLogRow = Database["public"]["Tables"]["set_logs"]["Row"];
