"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Dumbbell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Input, Label } from "@/components/ui";

type Mode = "login" | "signup" | "verify";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/today";
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setInfo(null);
    setCode("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.replace(next);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al entrar");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data.session) {
        // Email confirmation disabled — logged in directly.
        router.replace(next);
        router.refresh();
        return;
      }
      setMode("verify");
      setInfo("Te enviamos un código de 6 dígitos a tu email.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al crear cuenta");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const token = code.trim().replace(/\s/g, "");
      if (token.length < 6) throw new Error("El código debe tener 6 dígitos");
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "signup",
      });
      if (error) throw error;
      router.replace(next);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Código inválido");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) throw error;
      setInfo("Te enviamos un nuevo código.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo reenviar");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold">
            <span className="grid place-items-center size-9 rounded-lg bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/30">
              <Dumbbell className="size-4" />
            </span>
            FitForge
          </Link>
        </div>

        <Card>
          {mode === "verify" ? (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <h2 className="text-foreground font-semibold">Verifica tu email</h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Enviamos un código de 6 dígitos a <span className="text-neutral-200">{email}</span>
                </p>
              </div>

              <div>
                <Label>Código</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  className="text-center text-lg tracking-[0.5em]"
                />
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}
              {info && <p className="text-xs text-emerald-400">{info}</p>}

              <Button className="w-full" disabled={loading || code.length < 6}>
                {loading ? "Verificando..." : "Verificar"}
              </Button>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="text-indigo-300 hover:text-indigo-200"
                >
                  Reenviar código
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="text-neutral-400 hover:text-neutral-200"
                >
                  Volver
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex bg-[var(--surface-2)] rounded-md ring-1 ring-inset ring-[var(--border)] p-1 mb-5">
                {(["login", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => switchMode(m)}
                    className={[
                      "flex-1 text-sm py-1.5 rounded-md transition",
                      mode === m ? "bg-indigo-500 text-white" : "text-neutral-400 hover:text-neutral-100",
                    ].join(" ")}
                  >
                    {m === "login" ? "Iniciar sesión" : "Crear cuenta"}
                  </button>
                ))}
              </div>

              <form
                onSubmit={mode === "login" ? handleLogin : handleSignup}
                className="space-y-4"
              >
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                  />
                </div>
                <div>
                  <Label>Contraseña</Label>
                  <Input
                    type="password"
                    required
                    minLength={6}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                {error && <p className="text-xs text-red-400">{error}</p>}
                {info && <p className="text-xs text-emerald-400">{info}</p>}

                <Button className="w-full" disabled={loading}>
                  {loading ? "..." : mode === "login" ? "Entrar" : "Crear cuenta"}
                </Button>

                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!email) {
                        setError("Pon tu email arriba para introducir el código");
                        return;
                      }
                      switchMode("verify");
                      setMode("verify");
                    }}
                    className="text-xs text-neutral-400 hover:text-neutral-200 w-full text-center"
                  >
                    Ya tengo un código de verificación
                  </button>
                )}
              </form>

              <div className="my-4 flex items-center gap-2 text-[11px] text-neutral-500">
                <span className="flex-1 h-px bg-[var(--border)]" /> o <span className="flex-1 h-px bg-[var(--border)]" />
              </div>

              <Button variant="secondary" className="w-full" onClick={handleGoogle}>
                <svg className="size-4" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.12A6.5 6.5 0 0 1 5.5 12c0-.74.13-1.46.34-2.12V7.04H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.96l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
                </svg>
                Continuar con Google
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
