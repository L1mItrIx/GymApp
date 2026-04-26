"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label, Select } from "@/components/ui";
import { getProfile, upsertProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import type { ProfileRow } from "@/lib/supabase/types";

const GOAL_LABELS: Record<ProfileRow["goal"], string> = {
  hypertrophy: "Hipertrofia",
  strength: "Fuerza",
  weight_loss: "Pérdida de peso",
  endurance: "Resistencia",
  general_fitness: "Estado físico general",
};

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState<ProfileRow["goal"]>("hypertrophy");
  const [experience, setExperience] = useState<ProfileRow["experience"]>("beginner");
  const [days, setDays] = useState(4);
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return router.replace("/login");
      setUserId(data.user.id);
      setEmail(data.user.email ?? null);
      const p = await getProfile(data.user.id);
      if (p) {
        setProfile(p);
        setName(p.name);
        setGoal(p.goal);
        setExperience(p.experience);
        setDays(p.days_per_week);
      }
    })();
  }, [router, supabase]);

  const save = async () => {
    if (!userId) return;
    setSaving(true);
    setInfo(null);
    try {
      await upsertProfile({
        id: userId,
        name: name.trim(),
        goal,
        experience,
        days_per_week: days,
      });
      setInfo("Cambios guardados.");
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return <div className="max-w-2xl mx-auto px-4 py-10 text-neutral-400">Cargando...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Perfil</h1>
      <p className="text-sm text-neutral-400 mt-1">{email}</p>

      <Card className="mt-6 space-y-5">
        <div>
          <Label>Nombre</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Objetivo</Label>
            <Select value={goal} onChange={(e) => setGoal(e.target.value as ProfileRow["goal"])}>
              {(Object.keys(GOAL_LABELS) as ProfileRow["goal"][]).map((g) => (
                <option key={g} value={g}>{GOAL_LABELS[g]}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Experiencia</Label>
            <Select value={experience} onChange={(e) => setExperience(e.target.value as ProfileRow["experience"])}>
              <option value="beginner">Principiante</option>
              <option value="intermediate">Intermedio</option>
              <option value="advanced">Avanzado</option>
            </Select>
          </div>
        </div>

        <div>
          <Label>Días por semana</Label>
          <Select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {[2,3,4,5,6].map((n) => <option key={n} value={n}>{n} días</option>)}
          </Select>
        </div>

        {info && <p className="text-xs text-emerald-400">{info}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <form action="/auth/signout" method="post">
            <Button variant="secondary">Cerrar sesión</Button>
          </form>
          <Button onClick={save} disabled={saving || !name.trim()}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
