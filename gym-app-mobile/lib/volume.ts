import { exerciseById } from "./exercises";
import type { MuscleGroup, Routine, RoutineExercise } from "./types";

export interface VolumeLandmarks {
  MEV: number;
  MAV: [number, number];
  MRV: number;
}

export const VOLUME_LANDMARKS: Record<MuscleGroup, VolumeLandmarks> = {
  chest:       { MEV: 8,  MAV: [12, 20], MRV: 22 },
  back:        { MEV: 10, MAV: [14, 22], MRV: 25 },
  lats:        { MEV: 10, MAV: [14, 22], MRV: 25 },
  traps:       { MEV: 2,  MAV: [8, 12],  MRV: 16 },
  front_delts: { MEV: 0,  MAV: [6, 10],  MRV: 12 },
  side_delts:  { MEV: 8,  MAV: [16, 22], MRV: 26 },
  rear_delts:  { MEV: 6,  MAV: [10, 20], MRV: 25 },
  biceps:      { MEV: 8,  MAV: [14, 20], MRV: 26 },
  triceps:     { MEV: 6,  MAV: [10, 14], MRV: 18 },
  forearms:    { MEV: 2,  MAV: [6, 10],  MRV: 15 },
  quads:       { MEV: 8,  MAV: [12, 18], MRV: 20 },
  hamstrings:  { MEV: 6,  MAV: [10, 16], MRV: 20 },
  glutes:      { MEV: 0,  MAV: [4, 12],  MRV: 16 },
  calves:      { MEV: 8,  MAV: [12, 16], MRV: 20 },
  abs:         { MEV: 0,  MAV: [16, 20], MRV: 25 },
};

export type VolumeStatus = "low" | "mev" | "optimal" | "high" | "overload";

export interface VolumeAssessment {
  muscle: MuscleGroup;
  sets: number;
  status: VolumeStatus;
  score: number;
  message: string;
}

const SECONDARY_WEIGHT = 0.5;

export function setsPerMuscle(exercises: RoutineExercise[]): Record<MuscleGroup, number> {
  const totals = {} as Record<MuscleGroup, number>;
  for (const re of exercises) {
    const ex = exerciseById(re.exerciseId);
    if (!ex) continue;
    totals[ex.primary] = (totals[ex.primary] ?? 0) + re.sets;
    for (const sec of ex.secondary) {
      totals[sec] = (totals[sec] ?? 0) + re.sets * SECONDARY_WEIGHT;
    }
  }
  return totals;
}

export function weeklySetsFromRoutines(routines: Routine[]): Record<MuscleGroup, number> {
  const weekly = {} as Record<MuscleGroup, number>;
  for (const routine of routines) {
    const perRoutine = setsPerMuscle(routine.exercises);
    for (const key of Object.keys(perRoutine) as MuscleGroup[]) {
      weekly[key] = (weekly[key] ?? 0) + perRoutine[key];
    }
  }
  return weekly;
}

export function assessVolume(muscle: MuscleGroup, sets: number): VolumeAssessment {
  const l = VOLUME_LANDMARKS[muscle];
  let status: VolumeStatus;
  let message: string;

  if (sets < l.MEV) {
    status = "low";
    message = `Muy pocas series. Debajo del mínimo efectivo (${l.MEV}).`;
  } else if (sets < l.MAV[0]) {
    status = "mev";
    message = `Dentro del rango mínimo. Podrías añadir más series para progresar.`;
  } else if (sets <= l.MAV[1]) {
    status = "optimal";
    message = `Volumen óptimo para estímulo y recuperación.`;
  } else if (sets <= l.MRV) {
    status = "high";
    message = `Volumen alto. Cerca del máximo recuperable (${l.MRV}).`;
  } else {
    status = "overload";
    message = `Sobrecarga: superas el máximo recuperable (${l.MRV}). Riesgo de no recuperar.`;
  }

  const optimalMid = (l.MAV[0] + l.MAV[1]) / 2;
  const distance = Math.abs(sets - optimalMid);
  const span = Math.max(l.MRV - l.MAV[0], l.MAV[1]);
  const score = Math.max(0, Math.min(100, Math.round(100 - (distance / span) * 100)));

  return { muscle, sets: Math.round(sets * 10) / 10, status, score, message };
}

export function assessAll(sets: Record<MuscleGroup, number>): VolumeAssessment[] {
  return (Object.keys(sets) as MuscleGroup[])
    .filter((m) => sets[m] > 0)
    .map((m) => assessVolume(m, sets[m]))
    .sort((a, b) => b.sets - a.sets);
}

export const STATUS_STYLES: Record<VolumeStatus, { bg: string; text: string; border: string; label: string; barColor: string }> = {
  low:      { bg: "bg-red-950",     text: "text-red-300",     border: "border-red-800",     label: "Muy pocas series",      barColor: "#f87171" },
  mev:      { bg: "bg-amber-950",   text: "text-amber-300",   border: "border-amber-800",   label: "Por debajo del óptimo", barColor: "#fbbf24" },
  optimal:  { bg: "bg-emerald-950", text: "text-emerald-300", border: "border-emerald-800", label: "Óptimo",                barColor: "#34d399" },
  high:     { bg: "bg-orange-950",  text: "text-orange-300",  border: "border-orange-800",  label: "Volumen alto",          barColor: "#fb923c" },
  overload: { bg: "bg-red-900",     text: "text-red-300",     border: "border-red-700",     label: "Sobrecarga",            barColor: "#ef4444" },
};
