"use client";

import { MUSCLE_CATEGORIES, MUSCLE_LABELS } from "@/lib/muscles";
import type { MuscleGroup } from "@/lib/types";

export function MuscleSelector({
  value,
  onChange,
}: {
  value: MuscleGroup[];
  onChange: (next: MuscleGroup[]) => void;
}) {
  const toggle = (m: MuscleGroup) => {
    onChange(value.includes(m) ? value.filter((x) => x !== m) : [...value, m]);
  };

  const seen = new Set<MuscleGroup>();

  return (
    <div className="space-y-4">
      {MUSCLE_CATEGORIES.map((cat) => (
        <div key={cat.label}>
          <div className="text-xs uppercase tracking-wide text-neutral-500 mb-2">{cat.label}</div>
          <div className="flex flex-wrap gap-2">
            {cat.muscles
              .filter((m) => !seen.has(m))
              .map((m) => {
                seen.add(m);
                const active = value.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggle(m)}
                    className={[
                      "px-3 py-1.5 text-sm rounded-full ring-1 ring-inset transition",
                      active
                        ? "bg-indigo-500/20 text-indigo-200 ring-indigo-500/40"
                        : "bg-[var(--surface-2)] text-neutral-300 ring-[var(--border)] hover:ring-white/20",
                    ].join(" ")}
                  >
                    {MUSCLE_LABELS[m]}
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
