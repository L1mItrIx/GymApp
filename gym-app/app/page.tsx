import Link from "next/link";
import { redirect } from "next/navigation";
import { Dumbbell, Gauge, CalendarDays, Sparkles, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button, Card } from "@/components/ui";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/today");

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <section className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/20 text-xs mb-4">
          <Dumbbell className="size-3.5" /> Tu agenda semanal de gimnasio, optimizada
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
          Una rutina semanal,<br />
          <span className="text-indigo-400">bien distribuida.</span>
        </h1>
        <p className="mt-5 text-neutral-400 text-lg">
          Crea tu agenda Lunes-Domingo, recibe puntaje de optimización (descanso 48 h, frecuencia 2,
          distribución de volumen) y registra tu progreso por sesión.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/login">
            <Button>Iniciar sesión</Button>
          </Link>
          <Link href="/login?signup=1">
            <Button variant="secondary">Crear cuenta</Button>
          </Link>
        </div>
      </section>

      <section className="mt-16 grid md:grid-cols-3 gap-4">
        <Card>
          <CalendarDays className="size-5 text-indigo-400" />
          <h3 className="mt-3 font-medium">Agenda semanal persistente</h3>
          <p className="mt-1 text-sm text-neutral-400">
            Una rutina que mantienes durante semanas. Lun-Dom, con días de descanso explícitos.
          </p>
        </Card>
        <Card>
          <Sparkles className="size-5 text-amber-400" />
          <h3 className="mt-3 font-medium">Plantillas + personalización</h3>
          <p className="mt-1 text-sm text-neutral-400">
            Push/Pull/Legs, Upper/Lower, Full Body. Empieza con una y modifícala como quieras.
          </p>
        </Card>
        <Card>
          <Gauge className="size-5 text-emerald-400" />
          <h3 className="mt-3 font-medium">Optimización 48 h + frecuencia</h3>
          <p className="mt-1 text-sm text-neutral-400">
            Te avisamos si entrenas un músculo dos veces sin 48 h de descanso o si la distribución es desigual.
          </p>
        </Card>
        <Card>
          <TrendingUp className="size-5 text-rose-400" />
          <h3 className="mt-3 font-medium">Calendario y progreso</h3>
          <p className="mt-1 text-sm text-neutral-400">
            Registra peso, reps y RIR en cada sesión. Compara con sesiones anteriores del mismo ejercicio.
          </p>
        </Card>
      </section>
    </div>
  );
}
