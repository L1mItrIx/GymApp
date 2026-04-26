"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Sparkles } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { applyTemplateToPlan, ensurePlan } from "@/lib/data";
import { TEMPLATES } from "@/lib/templates";
import { MUSCLE_LABELS } from "@/lib/muscles";
import { createClient } from "@/lib/supabase/client";

const DAY_LABEL = ["L", "M", "X", "J", "V", "S", "D"];

export default function RoutinesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [planId, setPlanId] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return router.replace("/login");
      const p = await ensurePlan(data.user.id);
      setPlanId(p.id);
    })();
  }, [router, supabase]);

  const apply = async (templateId: string) => {
    if (!planId) return;
    const tpl = TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    const ok = window.confirm(
      `Esto reemplazará tu agenda actual con la rutina "${tpl.name}". ¿Continuar?`
    );
    if (!ok) return;
    setApplying(templateId);
    try {
      await applyTemplateToPlan(planId, tpl.days);
      router.push("/agenda");
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 text-amber-300 text-xs px-2.5 py-1 rounded-full bg-amber-500/10 ring-1 ring-inset ring-amber-500/30">
          <Sparkles className="size-3.5" /> Rutinas validadas
        </div>
        <h1 className="text-3xl font-semibold tracking-tight mt-3">Rutinas</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Empieza con una rutina probada o crea la tuya desde cero.
        </p>
      </div>

      <Card className="mb-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="grid place-items-center size-10 rounded-lg bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/30 shrink-0">
            <Pencil className="size-5" />
          </div>
          <div>
            <h2 className="font-medium">Quiero crear mi propia rutina</h2>
            <p className="text-sm text-neutral-400 mt-0.5">
              Configura tu agenda Lun→Dom desde cero, día por día.
            </p>
          </div>
        </div>
        <Link href="/agenda">
          <Button>Ir a la agenda</Button>
        </Link>
      </Card>

      <h3 className="text-xs uppercase tracking-wide text-neutral-500 mb-3">
        O empieza con una rutina recomendada
      </h3>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((tpl) => {
          const totalSets = tpl.days.reduce(
            (acc, d) => acc + d.exercises.reduce((a, e) => a + e.sets, 0),
            0
          );
          return (
            <Card key={tpl.id} className="flex flex-col">
              <h2 className="text-lg font-semibold">{tpl.name}</h2>
              <p className="text-sm text-neutral-400 mt-1">{tpl.description}</p>

              <div className="mt-3 flex gap-1">
                {tpl.days.map((d, i) => (
                  <div
                    key={i}
                    className={[
                      "flex-1 text-center text-[10px] py-1 rounded",
                      d.isRest ? "bg-emerald-500/10 text-emerald-300" : "bg-indigo-500/10 text-indigo-300",
                    ].join(" ")}
                    title={d.isRest ? "Descanso" : d.name ?? "Entreno"}
                  >
                    {DAY_LABEL[i]}
                  </div>
                ))}
              </div>

              <div className="mt-3 text-xs text-neutral-400">
                {tpl.daysPerWeek} días entrenando · {totalSets} series semanales
              </div>

              <div className="mt-3 space-y-1.5 flex-1 overflow-hidden">
                {tpl.days
                  .filter((d) => !d.isRest)
                  .slice(0, 2)
                  .map((d) => (
                    <div key={d.dayOfWeek} className="text-[11px]">
                      <span className="text-indigo-300 font-medium">{d.name}</span>
                      <span className="text-neutral-500">
                        {" — "}
                        {d.focus.slice(0, 3).map((m) => MUSCLE_LABELS[m]).join(", ")}
                        {d.focus.length > 3 && "..."}
                      </span>
                    </div>
                  ))}
              </div>

              <div className="mt-4">
                <Button
                  className="w-full"
                  onClick={() => apply(tpl.id)}
                  disabled={applying !== null}
                >
                  {applying === tpl.id ? "Aplicando..." : "Usar esta rutina"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
      <div className="mt-6 text-xs text-neutral-500">
        Aplicar una rutina reemplaza tu agenda actual. Después puedes editarla libremente.
      </div>
    </div>
  );
}
