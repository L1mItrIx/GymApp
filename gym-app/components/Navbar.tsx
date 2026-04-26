"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  CalendarDays,
  CircleUser,
  Dumbbell,
  LogOut,
  Sparkles,
  Sun,
  TrendingUp,
} from "lucide-react";
import type { ComponentType } from "react";

const links: { href: string; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { href: "/today",    label: "Hoy",       icon: Sun },
  { href: "/agenda",   label: "Agenda",    icon: CalendarDays },
  { href: "/routines", label: "Rutinas",   icon: Sparkles },
  { href: "/progress", label: "Progreso",  icon: Calendar },
  { href: "/analysis", label: "Análisis",  icon: TrendingUp },
  { href: "/profile",  label: "Perfil",    icon: CircleUser },
];

export function Navbar({ userEmail }: { userEmail?: string | null }) {
  const pathname = usePathname();
  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]/70 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
        <Link href="/today" className="flex items-center gap-2 font-semibold tracking-tight shrink-0">
          <span className="grid place-items-center size-8 rounded-lg bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/30">
            <Dumbbell className="size-4" />
          </span>
          <span className="hidden sm:inline">FitForge</span>
        </Link>

        <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-thin flex-1 min-w-0">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-md whitespace-nowrap transition shrink-0",
                  active
                    ? "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/30"
                    : "text-neutral-400 hover:text-neutral-100 hover:bg-white/5",
                ].join(" ")}
              >
                <Icon className="size-4" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        <form action="/auth/signout" method="post" className="shrink-0 ml-2">
          <button
            type="submit"
            title={userEmail ?? undefined}
            className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs text-neutral-400 hover:text-neutral-100 hover:bg-white/5 rounded-md"
          >
            <LogOut className="size-4" />
            <span className="hidden lg:inline">Salir</span>
          </button>
        </form>
      </div>
    </header>
  );
}
