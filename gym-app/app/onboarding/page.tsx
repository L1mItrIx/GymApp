"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Flame, Heart, Scale, Trophy } from "lucide-react";
import { Button, Card, Input, Label, Select } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { ensurePlan, getProfile, upsertProfile } from "@/lib/data";
import type { ProfileRow } from "@/lib/supabase/types";

const GOALS: { id: ProfileRow["goal"]; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "hypertrophy",     label: "Ganar masa muscular", desc: "Volumen medio-alto, 8-15 reps", icon: Flame },
  { id: "strength",        label: "Fuerza",               desc: "Series pesadas, 3-6 reps",     icon: Trophy },
  { id: "weight_loss",     label: "Perder peso",          desc: "Circuitos, gasto calórico",    icon: Scale },
  { id: "endurance",       label: "Resistencia",          desc: "15+ reps, descansos cortos",   icon: Heart },
  { id: "general_fitness", label: "Estado físico general",desc: "Rutinas equilibradas",         icon: Activity },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState<ProfileRow["goal"]>("hypertrophy");
  const [experience, setExperience] = useState<ProfileRow["experience"]>("beginner");
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/login");
        return;
      }
      setUserId(data.user.id);
      const existing = await getProfile(data.user.id);
      if (existing) {
        router.replace("/today");
        return;
      }
      if (data.user.user_metadata?.full_name) {
        setName(data.user.user_metadata.full_name as string);
      } else if (data.user.email) {
        setName(data.user.email.split("@")[0]);
      }
    })();
  }, [router, supabase]);

  const submit = async () => {
    if (!userId || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await upsertProfile({
        id: userId,
        name: name.trim(),
        goal,
        experience,
        days_per_week: daysPerWeek,
      });
      await ensurePlan(userId);
      router.replace("/today");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Vamos a conocerte</h1>
      <p className="mt-2 text-neutral-400">
        Configuramos tu perfil para personalizar las recomendaciones.
      </p>

      <Card className="mt-8 space-y-5">
        <div>
          <Label>¿Cómo te llamamos?</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
        </div>

        <div>
          <Label>¿Cuál es tu objetivo principal?</Label>
          <div className="grid sm:grid-cols-2 gap-2 mt-1">
            {GOALS.map(({ id, label, desc, icon: Icon }) => {
              const active = goal === id;
              return (
                <button
                  key={id}
                  onClick={() => setGoal(id)}
                  className={[
                    "text-left p-4 rounded-lg ring-1 ring-inset transition",
                    active ? "bg-indigo-500/10 ring-indigo-500/40" : "bg-[var(--surface-2)] ring-[var(--border)] hover:ring-white/20",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <span className={["grid place-items-center size-9 rounded-md shrink-0", active ? "bg-indigo-500/20 text-indigo-300" : "bg-white/5 text-neutral-400"].join(" ")}>
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-xs text-neutral-400 mt-0.5">{desc}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Nivel de experiencia</Label>
            <Select value={experience} onChange={(e) => setExperience(e.target.value as ProfileRow["experience"])}>
              <option value="beginner">Principiante (0-1 año)</option>
              <option value="intermediate">Intermedio (1-3 años)</option>
              <option value="advanced">Avanzado (3+ años)</option>
            </Select>
          </div>
          <div>
            <Label>Días por semana</Label>
            <Select value={daysPerWeek} onChange={(e) => setDaysPerWeek(Number(e.target.value))}>
              {[2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n} días</option>
              ))}
            </Select>
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex justify-end pt-2">
          <Button onClick={submit} disabled={!name.trim() || saving}>
            {saving ? "Guardando..." : "Continuar"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
