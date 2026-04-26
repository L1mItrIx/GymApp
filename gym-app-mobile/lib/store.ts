import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Routine, RoutineExercise, UserProfile } from "./types";

interface AppState {
  profile: UserProfile | null;
  routines: Routine[];
  hydrated: boolean;
  setProfile: (profile: UserProfile) => void;
  resetProfile: () => void;
  addRoutine: (routine: Omit<Routine, "id" | "createdAt" | "updatedAt">) => string;
  updateRoutine: (id: string, patch: Partial<Omit<Routine, "id" | "createdAt">>) => void;
  deleteRoutine: (id: string) => void;
  addExerciseToRoutine: (routineId: string, exercise: RoutineExercise) => void;
  updateRoutineExercise: (routineId: string, index: number, patch: Partial<RoutineExercise>) => void;
  removeRoutineExercise: (routineId: string, index: number) => void;
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      profile: null,
      routines: [],
      hydrated: false,

      setProfile: (profile) => set({ profile }),
      resetProfile: () => set({ profile: null, routines: [] }),

      addRoutine: (routine) => {
        const id = uid();
        const now = Date.now();
        set({
          routines: [
            ...get().routines,
            { ...routine, id, createdAt: now, updatedAt: now },
          ],
        });
        return id;
      },

      updateRoutine: (id, patch) => {
        set({
          routines: get().routines.map((r) =>
            r.id === id ? { ...r, ...patch, updatedAt: Date.now() } : r
          ),
        });
      },

      deleteRoutine: (id) => {
        set({ routines: get().routines.filter((r) => r.id !== id) });
      },

      addExerciseToRoutine: (routineId, exercise) => {
        set({
          routines: get().routines.map((r) =>
            r.id === routineId
              ? { ...r, exercises: [...r.exercises, exercise], updatedAt: Date.now() }
              : r
          ),
        });
      },

      updateRoutineExercise: (routineId, index, patch) => {
        set({
          routines: get().routines.map((r) => {
            if (r.id !== routineId) return r;
            const exercises = r.exercises.map((e, i) =>
              i === index ? { ...e, ...patch } : e
            );
            return { ...r, exercises, updatedAt: Date.now() };
          }),
        });
      },

      removeRoutineExercise: (routineId, index) => {
        set({
          routines: get().routines.map((r) =>
            r.id === routineId
              ? {
                  ...r,
                  exercises: r.exercises.filter((_, i) => i !== index),
                  updatedAt: Date.now(),
                }
              : r
          ),
        });
      },
    }),
    {
      name: "fitforge-state-v1",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);
