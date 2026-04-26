import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "FitForge — Tu rutina semanal optimizada",
  description: "Diseña tu agenda semanal, mide tu volumen, descanso y progreso por sesión.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        {user && <Navbar userEmail={user.email} />}
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[var(--border)] px-6 py-4 text-xs text-neutral-500">
          FitForge · Datos en Supabase · Auth con email + Google
        </footer>
      </body>
    </html>
  );
}
