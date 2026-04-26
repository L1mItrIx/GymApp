"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import { OptimizationPanel } from "@/components/OptimizationPanel";
import { ensurePlan, type FullPlan } from "@/lib/data";
import { analyzePlan, type PlanDayInput } from "@/lib/optimization";
import { createClient } from "@/lib/supabase/client";

export default function AnalysisPage() {
  const router = useRouter();
  const supabase = createClient();
  const [plan, setPlan] = useState<FullPlan | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return router.replace("/login");
      const p = await ensurePlan(data.user.id);
      setPlan(p);
    })();
  }, [router, supabase]);

  const report = useMemo(() => {
    if (!plan) return null;
    const input: PlanDayInput[] = plan.days.map((d) => ({
      dayOfWeek: d.day_of_week,
      isRest: d.is_rest,
      exercises: d.exercises.map((e) => ({ exerciseId: e.exercise_id, sets: e.sets })),
    }));
    return analyzePlan(input);
  }, [plan]);

  if (!plan || !report) {
    return <div className="max-w-4xl mx-auto px-4 py-10 text-neutral-400">Cargando...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Análisis de tu agenda</h1>
      <p className="text-sm text-neutral-400 mt-1">
        Volumen, descanso de 48 h, frecuencia y distribución por día.
      </p>

      <Card className="mt-6">
        <OptimizationPanel report={report} />
      </Card>
    </div>
  );
}
