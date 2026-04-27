"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronRight, Coffee, Dumbbell } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { ensurePlan, getProfile, type FullPlan } from "@/lib/data";
import { exerciseById } from "@/lib/exercises";
import { MUSCLE_LABELS } from "@/lib/muscles";
import { createClient } from "@/lib/supabase/client";

const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function todayDayOfWeek(): number {
  // JS: Sunday=0..Saturday=6. We want Monday=0..Sunday=6.
  const js = new Date().getDay();
  return (js + 6) % 7;
}

function todayDateISO(): string {
  const d = new Date();
  const tz = d.getTimezoneOffset();
  return new Date(d.getTime() - tz * 60_000).toISOString().slice(0, 10);
}

export default function TodayPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<FullPlan | null>(null);
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/login");
        return;
      }
      const profile = await getProfile(data.user.id);
      if (!profile) {
        router.replace("/onboarding");
        return;
      }
      setProfileName(profile.name);
      const p = await ensurePlan(data.user.id);
      setPlan(p);
      setLoading(false);
    })();
  }, [router, supabase]);

  if (loading || !plan) {
    return <div className="max-w-5xl mx-auto px-4 py-10 text-neutral-400">Cargando...</div>;
  }

  const dow = todayDayOfWeek();
  const today = plan.days.find((d) => d.day_of_week === dow);
  const dateISO = todayDateISO();
  const isRest = !today || today.is_rest;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div
        className={[
          "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ring-1 ring-inset mb-3",
          isRest
            ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30"
            : "bg-indigo-500/10 text-indigo-300 ring-indigo-500/30",
        ].join(" ")}
      >
        {isRest ? <Coffee className="size-3.5" /> : <Dumbbell className="size-3.5" />}
        {isRest ? "Día de descanso" : `Día de entreno · ${today?.name ?? "Sin nombre"}`}
      </div>

      <h1 className="text-3xl font-semibold tracking-tight">
        {isRest ? `Descansa hoy, ${profileName}` : `A entrenar, ${profileName}`}
      </h1>
      <p className="text-sm text-neutral-400 mt-1">
        Hoy es <span className="text-neutral-200">{DAY_NAMES[dow]}</span>
        {isRest
          ? " · sin sesión programada"
          : today?.focus && today.focus.length > 0
          ? ` · enfocas ${today.focus
              .slice(0, 3)
              .map((m) => MUSCLE_LABELS[m as keyof typeof MUSCLE_LABELS])
              .join(", ")}`
          : ""}
      </p>

      <div className="grid md:grid-cols-[1fr_320px] gap-5 mt-6">
        <Card>
          {!today || today.is_rest ? (
            <div className="flex items-start gap-3">
              <Coffee className="size-5 text-emerald-400" />
              <div className="flex-1">
                <h2 className="font-medium">Día de descanso</h2>
                <p className="text-sm text-neutral-400 mt-1">
                  Hoy no toca entrenar según tu agenda. Aprovecha para recuperarte.
                </p>
                <div className="mt-4">
                  <Link href="/agenda">
                    <Button variant="secondary">
                      <CalendarDays className="size-4" /> Ver mi agenda
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-indigo-300 uppercase tracking-wide">{DAY_NAMES[dow]}</div>
                  <h2 className="text-xl font-semibold mt-1">{today.name ?? "Entrenamiento"}</h2>
                  {today.focus.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {today.focus.map((m) => (
                        <span key={m} className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 ring-1 ring-inset ring-[var(--border)]">
                          {MUSCLE_LABELS[m as keyof typeof MUSCLE_LABELS]}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <Link href={`/progress/${dateISO}`}>
                  <Button>Registrar sesión</Button>
                </Link>
              </div>

              <div className="mt-5 space-y-1.5">
                {today.exercises.length === 0 ? (
                  <p className="text-sm text-neutral-500 italic">
                    No has añadido ejercicios aún. Configura este día desde la agenda.
                  </p>
                ) : (
                  today.exercises.map((ex) => {
                    const data = exerciseById(ex.exercise_id);
                    if (!data) return null;
                    return (
                      <div
                        key={ex.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-md bg-[var(--surface-2)] ring-1 ring-inset ring-[var(--border)]"
                      >
                        <div>
                          <div className="text-sm font-medium">{data.name}</div>
                          <div className="text-[11px] text-neutral-400">
                            {MUSCLE_LABELS[data.primary]} · {ex.sets} × {ex.reps} {ex.rir != null && `· RIR ${ex.rir}`}
                          </div>
                        </div>
                        <Dumbbell className="size-4 text-neutral-500" />
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </Card>

        <Card>
          <h3 className="font-medium">Accesos rápidos</h3>
          <div className="mt-3 space-y-1">
            <QuickLink href="/agenda" label="Editar mi agenda semanal" />
            <QuickLink href={`/progress/${dateISO}`} label="Registrar lo de hoy" />
            <QuickLink href="/progress" label="Calendario de sesiones" />
            <QuickLink href="/analysis" label="Análisis de optimización" />
            <QuickLink href="/routines" label="Rutinas" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-white/5 text-sm text-neutral-200"
    >
      <span>{label}</span>
      <ChevronRight className="size-4 text-neutral-500" />
    </Link>
  );
}

