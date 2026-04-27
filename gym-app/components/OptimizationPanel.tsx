"use client";

import { CheckCircle2, AlertTriangle, AlertCircle, BarChart3, Check } from "lucide-react";
import { MUSCLE_LABELS } from "@/lib/muscles";
import type { OptimizationReport } from "@/lib/optimization";
import { STATUS_STYLES } from "@/lib/volume";

const DAY_SHORT = ["L", "M", "X", "J", "V", "S", "D"];

const WARNING_ICON = {
  rest: AlertTriangle,
  frequency: AlertCircle,
  volume: AlertCircle,
  distribution: BarChart3,
} as const;

const WARNING_COLOR = {
  rest: "text-red-400 bg-red-500/10 ring-red-500/30",
  frequency: "text-amber-400 bg-amber-500/10 ring-amber-500/30",
  volume: "text-amber-400 bg-amber-500/10 ring-amber-500/30",
  distribution: "text-sky-400 bg-sky-500/10 ring-sky-500/30",
} as const;

export function OptimizationPanel({ report }: { report: OptimizationReport }) {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Puntaje de optimización</h3>
          <span className="text-2xl font-semibold text-indigo-300">{report.score}/100</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500"
            style={{ width: `${report.score}%` }}
          />
        </div>
        <p className="text-[11px] text-neutral-500 mt-1.5">
          Pondera volumen ×0.35 · descanso ×0.30 · frecuencia ×0.20 · distribución ×0.15
        </p>
      </div>

      {report.warnings.length > 0 ? (
        <div className="space-y-1.5">
          {report.warnings.map((w, i) => {
            const Icon = WARNING_ICON[w.kind];
            return (
              <div
                key={i}
                className={`flex items-start gap-2 p-2.5 rounded-md ring-1 ring-inset text-xs ${WARNING_COLOR[w.kind]}`}
              >
                <Icon className="size-4 shrink-0 mt-0.5" />
                <span>{w.message}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-start gap-2 p-2.5 rounded-md ring-1 ring-inset text-xs text-emerald-400 bg-emerald-500/10 ring-emerald-500/30">
          <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
          <span>Tu agenda no tiene problemas detectados. Buen trabajo.</span>
        </div>
      )}

      <div>
        <h4 className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Por músculo</h4>
        <ul className="space-y-1.5">
          {report.perMuscle.map((m) => {
            const s = STATUS_STYLES[m.volume.status];
            const restOk = m.frequency < 2 || m.minRestHours >= 48;
            return (
              <li key={m.muscle} className={`p-2.5 rounded-md ring-1 ring-inset ${s.ring} ${s.bg}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{MUSCLE_LABELS[m.muscle]}</span>
                  <span className="text-xs text-neutral-300">
                    {m.weeklySets} series · freq {m.frequency}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {DAY_SHORT.map((d, i) => (
                      <span
                        key={i}
                        className={`size-5 grid place-items-center text-[10px] rounded ${
                          m.daysHit.includes(i)
                            ? "bg-indigo-500/30 text-indigo-200"
                            : "bg-white/5 text-neutral-600"
                        }`}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                  <span className={`ml-auto inline-flex items-center gap-1 text-[11px] ${restOk ? "text-emerald-400" : "text-red-400"}`}>
                    {m.frequency < 2 ? (
                      "—"
                    ) : (
                      <>
                        {Math.round(m.minRestHours)} h descanso
                        {m.minRestHours >= 48 ? (
                          <Check className="size-3" />
                        ) : (
                          <AlertTriangle className="size-3" />
                        )}
                      </>
                    )}
                  </span>
                </div>
              </li>
            );
          })}
          {report.perMuscle.length === 0 && (
            <li className="text-sm text-neutral-500 italic">
              Añade ejercicios a tu agenda para ver el análisis.
            </li>
          )}
        </ul>
      </div>

      <div>
        <h4 className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
          Distribución del volumen
        </h4>
        <div className="flex items-end gap-1 h-20">
          {Array.from({ length: 7 }, (_, dow) => {
            const day = report.distribution.setsPerTrainingDay.find((d) => d.dayOfWeek === dow);
            const max = Math.max(
              1,
              ...report.distribution.setsPerTrainingDay.map((d) => d.sets)
            );
            const pct = day ? (day.sets / max) * 100 : 0;
            return (
              <div key={dow} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex-1 w-full flex items-end">
                  <div
                    className="w-full rounded-t bg-indigo-500/40"
                    style={{ height: `${pct}%`, minHeight: day ? 2 : 0 }}
                  />
                </div>
                <span className="text-[10px] text-neutral-500">{DAY_SHORT[dow]}</span>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-neutral-500 mt-2">
          CV = {(report.distribution.cv * 100).toFixed(0)}% · puntaje {report.distribution.score}/100
        </p>
      </div>
    </div>
  );
}
