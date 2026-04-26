import { exerciseById } from "./exercises";
import { MUSCLE_LABELS } from "./muscles";
import type { MuscleGroup } from "./types";
import { VOLUME_LANDMARKS, assessVolume, type VolumeAssessment } from "./volume";

export interface PlanDayInput {
  dayOfWeek: number; // 0=Mon ... 6=Sun
  isRest: boolean;
  exercises: { exerciseId: string; sets: number }[];
}

export interface MuscleSchedule {
  muscle: MuscleGroup;
  daysHit: number[]; // sorted ascending, 0=Mon
  frequency: number;
  minRestHours: number; // smallest gap (in hours) between consecutive sessions hitting this muscle (cyclic)
  weeklySets: number;
  volume: VolumeAssessment;
}

export interface OptimizationReport {
  score: number; // 0-100 overall
  perMuscle: MuscleSchedule[];
  warnings: { kind: "rest" | "frequency" | "volume" | "distribution"; message: string }[];
  distribution: {
    setsPerTrainingDay: { dayOfWeek: number; sets: number }[];
    cv: number; // coefficient of variation (lower = more even)
    score: number;
  };
}

const SECONDARY_WEIGHT = 0.5;
// Major muscles where frequency 2 is recommended (per user request).
const FREQUENCY_2_MUSCLES: MuscleGroup[] = [
  "chest",
  "back",
  "lats",
  "side_delts",
  "biceps",
  "triceps",
  "quads",
  "hamstrings",
  "glutes",
];

export function buildMuscleSchedule(plan: PlanDayInput[]): Map<MuscleGroup, { daysHit: Set<number>; sets: number }> {
  const map = new Map<MuscleGroup, { daysHit: Set<number>; sets: number }>();

  for (const day of plan) {
    if (day.isRest) continue;
    for (const ex of day.exercises) {
      const data = exerciseById(ex.exerciseId);
      if (!data) continue;

      const add = (m: MuscleGroup, sets: number) => {
        const cur = map.get(m) ?? { daysHit: new Set<number>(), sets: 0 };
        cur.daysHit.add(day.dayOfWeek);
        cur.sets += sets;
        map.set(m, cur);
      };

      add(data.primary, ex.sets);
      for (const sec of data.secondary) add(sec, ex.sets * SECONDARY_WEIGHT);
    }
  }

  return map;
}

function minCyclicGapHours(days: number[]): number {
  if (days.length <= 1) return 7 * 24;
  const sorted = [...days].sort((a, b) => a - b);
  let minGap = Infinity;
  for (let i = 0; i < sorted.length; i++) {
    const next = i === sorted.length - 1 ? sorted[0] + 7 : sorted[i + 1];
    const gapDays = next - sorted[i];
    minGap = Math.min(minGap, gapDays);
  }
  return minGap * 24;
}

export function analyzePlan(plan: PlanDayInput[]): OptimizationReport {
  const map = buildMuscleSchedule(plan);
  const perMuscle: MuscleSchedule[] = [];
  const warnings: OptimizationReport["warnings"] = [];

  for (const [muscle, data] of map.entries()) {
    const daysHit = [...data.daysHit].sort((a, b) => a - b);
    const frequency = daysHit.length;
    const minRestHours = minCyclicGapHours(daysHit);
    const weeklySets = Math.round(data.sets * 10) / 10;
    const volume = assessVolume(muscle, weeklySets);

    perMuscle.push({ muscle, daysHit, frequency, minRestHours, weeklySets, volume });

    if (frequency >= 2 && minRestHours < 48) {
      warnings.push({
        kind: "rest",
        message: `${MUSCLE_LABELS[muscle]} se entrena con menos de 48 h de descanso (${Math.round(minRestHours)} h).`,
      });
    }

    if (FREQUENCY_2_MUSCLES.includes(muscle) && weeklySets >= VOLUME_LANDMARKS[muscle].MEV && frequency < 2) {
      warnings.push({
        kind: "frequency",
        message: `${MUSCLE_LABELS[muscle]} solo se trabaja 1 día a la semana. Se recomienda frecuencia 2 para mejor estímulo.`,
      });
    }

    if (volume.status === "low" || volume.status === "overload") {
      warnings.push({
        kind: "volume",
        message: `${MUSCLE_LABELS[muscle]}: ${volume.message}`,
      });
    }
  }

  // Distribution: variance of total sets across training days
  const trainingDays = plan
    .filter((d) => !d.isRest)
    .map((d) => ({
      dayOfWeek: d.dayOfWeek,
      sets: d.exercises.reduce((acc, e) => acc + e.sets, 0),
    }));

  const setsArr = trainingDays.map((d) => d.sets).filter((s) => s > 0);
  const mean = setsArr.length ? setsArr.reduce((a, b) => a + b, 0) / setsArr.length : 0;
  const variance =
    setsArr.length > 1
      ? setsArr.reduce((a, b) => a + (b - mean) ** 2, 0) / setsArr.length
      : 0;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
  const distributionScore = Math.max(0, Math.min(100, Math.round(100 - cv * 80)));

  if (cv > 0.5 && setsArr.length > 1) {
    warnings.push({
      kind: "distribution",
      message: "El volumen está mal repartido entre días. Algunos días son muy pesados y otros muy ligeros.",
    });
  }

  // Overall score: weighted average of components
  const volumeScores = perMuscle.map((m) => m.volume.score);
  const volumeAvg = volumeScores.length ? volumeScores.reduce((a, b) => a + b, 0) / volumeScores.length : 100;

  const restPenalty = perMuscle.reduce((acc, m) => {
    if (m.frequency < 2) return acc;
    return acc + (m.minRestHours < 48 ? Math.max(0, 48 - m.minRestHours) : 0);
  }, 0);
  const restScore = Math.max(0, 100 - restPenalty * 1.5);

  const frequencyHits = perMuscle.filter(
    (m) => FREQUENCY_2_MUSCLES.includes(m.muscle) && m.weeklySets >= VOLUME_LANDMARKS[m.muscle].MEV
  );
  const frequencyOk = frequencyHits.filter((m) => m.frequency >= 2).length;
  const frequencyScore = frequencyHits.length
    ? Math.round((frequencyOk / frequencyHits.length) * 100)
    : 100;

  const score = Math.round(
    volumeAvg * 0.35 + restScore * 0.3 + frequencyScore * 0.2 + distributionScore * 0.15
  );

  return {
    score,
    perMuscle: perMuscle.sort((a, b) => b.weeklySets - a.weeklySets),
    warnings,
    distribution: {
      setsPerTrainingDay: trainingDays,
      cv,
      score: distributionScore,
    },
  };
}
