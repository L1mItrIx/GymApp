"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import { listSessionDates } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DAY_HEADERS = ["L", "M", "X", "J", "V", "S", "D"];

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date)   { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function iso(d: Date)          { const tz = d.getTimezoneOffset(); return new Date(d.getTime() - tz*60_000).toISOString().slice(0, 10); }

export default function ProgressPage() {
  const router = useRouter();
  const supabase = createClient();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [sessionDates, setSessionDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return router.replace("/login");
      const start = iso(startOfMonth(cursor));
      const end = iso(endOfMonth(cursor));
      const dates = await listSessionDates(data.user.id, start, end);
      setSessionDates(new Set(dates));
      setLoading(false);
    })();
  }, [router, supabase, cursor]);

  const grid = useMemo(() => buildMonthGrid(cursor), [cursor]);
  const todayISO = iso(new Date());

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Progreso</h1>
      <p className="text-sm text-neutral-400 mt-1">
        Selecciona un día para registrar o revisar tu sesión.
      </p>

      <Card className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
            className="p-1.5 rounded hover:bg-white/5"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="text-sm font-medium">
            {cursor.toLocaleDateString("es", { month: "long", year: "numeric" })}
          </div>
          <button
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
            className="p-1.5 rounded hover:bg-white/5"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-[10px] text-neutral-500 mb-2">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="text-center">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {grid.map(({ date, inMonth }, i) => {
            const dateISO = iso(date);
            const has = sessionDates.has(dateISO);
            const isToday = dateISO === todayISO;
            return (
              <Link
                key={i}
                href={`/progress/${dateISO}`}
                className={[
                  "aspect-square flex flex-col items-center justify-center rounded-md text-sm transition",
                  inMonth ? "" : "opacity-30",
                  isToday
                    ? "ring-1 ring-inset ring-indigo-500/40 bg-indigo-500/10 text-indigo-200"
                    : has
                    ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/30"
                    : "hover:bg-white/5 text-neutral-300",
                ].join(" ")}
              >
                <span>{date.getDate()}</span>
                {has && <span className="size-1 rounded-full bg-emerald-400 mt-0.5" />}
              </Link>
            );
          })}
        </div>

        {loading && <p className="text-xs text-neutral-500 mt-3">Cargando...</p>}
      </Card>

      <p className="mt-4 text-xs text-neutral-500">
        Los días en verde tienen al menos una sesión registrada. Toca un día para ver detalles o registrar.
      </p>
    </div>
  );
}

function buildMonthGrid(cursor: Date): { date: Date; inMonth: boolean }[] {
  const first = startOfMonth(cursor);
  const last = endOfMonth(cursor);
  // Make Monday=0 ... Sunday=6
  const firstWeekday = (first.getDay() + 6) % 7;
  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < firstWeekday; i++) {
    const d = new Date(first);
    d.setDate(d.getDate() - (firstWeekday - i));
    cells.push({ date: d, inMonth: false });
  }
  for (let day = 1; day <= last.getDate(); day++) {
    cells.push({ date: new Date(cursor.getFullYear(), cursor.getMonth(), day), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    const d = new Date(last);
    d.setDate(d.getDate() + 1);
    cells.push({ date: d, inMonth: false });
  }
  return cells;
}
