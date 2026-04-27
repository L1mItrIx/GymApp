import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { Button, Card, Input, Label } from "@/components/ui";
import { supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

const redirectTo = AuthSession.makeRedirectUri({ scheme: "fitforge", path: "auth/callback" });

type Mode = "login" | "signup" | "verify";

const HIGHLIGHTS: { icon: keyof typeof Ionicons.glyphMap; text: string; color: string }[] = [
  { icon: "calendar", text: "Tu agenda Lun→Dom",        color: "#a5b4fc" },
  { icon: "barbell",  text: "Rutinas a tu medida",       color: "#34d399" },
  { icon: "speedometer", text: "Volumen y descanso óptimos", color: "#fbbf24" },
];

export default function LoginScreen() {
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

  const handleLogin = async () => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al entrar");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data.session) return;
      setMode("verify");
      setInfo("Te enviamos un código de 6 dígitos.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al crear cuenta");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
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
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("No OAuth URL returned");

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== "success") return;

      const url = new URL(result.url);
      const params = new URLSearchParams(
        url.hash ? url.hash.replace(/^#/, "") : url.search.replace(/^\?/, "")
      );
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const codeFromUrl = params.get("code");

      if (accessToken && refreshToken) {
        const { error: setErr } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (setErr) throw setErr;
      } else if (codeFromUrl) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(codeFromUrl);
        if (exErr) throw exErr;
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error con Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        contentContainerClassName="px-5 pt-8 pb-10 gap-6"
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <View className="items-center">
          <View className="size-20 rounded-3xl bg-indigo-500/15 border border-indigo-500/40 items-center justify-center mb-4">
            <Ionicons name="barbell" size={36} color="#a5b4fc" />
          </View>
          <Text className="text-foreground text-3xl font-bold tracking-tight">
            FitForge
          </Text>
          <Text className="text-neutral-300 text-base mt-2 text-center px-2">
            Tu rutina de gimnasio,{"\n"}hecha a tu medida.
          </Text>
        </View>

        {/* Value props */}
        {mode !== "verify" && (
          <View className="gap-2">
            {HIGHLIGHTS.map((h) => (
              <View
                key={h.text}
                className="flex-row items-center gap-3 px-3 py-2.5 rounded-lg bg-surface border border-border"
              >
                <View
                  className="size-8 rounded-md items-center justify-center"
                  style={{ backgroundColor: `${h.color}20` }}
                >
                  <Ionicons name={h.icon} size={14} color={h.color} />
                </View>
                <Text className="text-foreground text-sm flex-1">{h.text}</Text>
                <Ionicons name="checkmark-circle" size={14} color={h.color} />
              </View>
            ))}
          </View>
        )}

        {mode === "verify" ? (
          <Card>
            <View className="items-center mb-3">
              <View className="size-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 items-center justify-center mb-2">
                <Ionicons name="mail" size={20} color="#34d399" />
              </View>
              <Text className="text-foreground font-semibold text-base">Revisa tu email</Text>
              <Text className="text-neutral-400 text-xs mt-1 text-center">
                Enviamos un código de 6 dígitos a{"\n"}
                <Text className="text-foreground">{email}</Text>
              </Text>
            </View>

            <View className="gap-3 mt-2">
              <View>
                <Label>Código</Label>
                <Input
                  value={code}
                  onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
                  keyboardType="number-pad"
                  placeholder="123456"
                  maxLength={6}
                  className="text-center text-xl tracking-[8px] py-3"
                />
              </View>

              {error && <Text className="text-red-400 text-xs">{error}</Text>}
              {info && <Text className="text-emerald-400 text-xs">{info}</Text>}

              <Pressable onPress={handleVerify} disabled={loading || code.length < 6}>
                <Button disabled={loading || code.length < 6}>
                  <Text className="text-white text-sm font-semibold">
                    {loading ? "Verificando..." : "Verificar y entrar"}
                  </Text>
                </Button>
              </Pressable>

              <Pressable onPress={handleResend} disabled={loading}>
                <Text className="text-indigo-300 text-xs text-center">
                  Reenviar código
                </Text>
              </Pressable>

              <Pressable onPress={() => switchMode("login")}>
                <Text className="text-neutral-500 text-xs text-center">
                  Volver
                </Text>
              </Pressable>
            </View>
          </Card>
        ) : (
          <Card>
            <Text className="text-foreground font-semibold text-base mb-1">
              {mode === "login" ? "Bienvenido de vuelta" : "Empecemos"}
            </Text>
            <Text className="text-neutral-400 text-xs mb-4">
              {mode === "login"
                ? "Entra para seguir con tu rutina."
                : "Crea tu cuenta y arma tu primera agenda en 1 minuto."}
            </Text>

            <View className="flex-row bg-surface-2 rounded-md border border-border p-1 mb-4">
              {(["login", "signup"] as const).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => switchMode(m)}
                  className={[
                    "flex-1 py-2 rounded items-center",
                    mode === m ? "bg-indigo-500" : "",
                  ].join(" ")}
                >
                  <Text
                    className={[
                      "text-sm",
                      mode === m ? "text-white font-semibold" : "text-neutral-400",
                    ].join(" ")}
                  >
                    {m === "login" ? "Entrar" : "Crear cuenta"}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View className="gap-3">
              <View>
                <Label>Email</Label>
                <Input
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="tu@email.com"
                />
              </View>
              <View>
                <Label>Contraseña</Label>
                <Input
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="••••••••"
                />
              </View>

              {error && <Text className="text-red-400 text-xs">{error}</Text>}
              {info && <Text className="text-emerald-400 text-xs">{info}</Text>}

              <Pressable
                onPress={mode === "login" ? handleLogin : handleSignup}
                disabled={loading || !email || !password}
              >
                <Button disabled={loading || !email || !password}>
                  <Text className="text-white text-sm font-semibold">
                    {loading ? "..." : mode === "login" ? "Entrar" : "Crear cuenta"}
                  </Text>
                </Button>
              </Pressable>

              {mode === "login" && (
                <Pressable
                  onPress={() => {
                    if (!email) {
                      setError("Pon tu email arriba para introducir el código");
                      return;
                    }
                    setMode("verify");
                  }}
                >
                  <Text className="text-neutral-500 text-xs text-center">
                    Ya tengo un código de verificación
                  </Text>
                </Pressable>
              )}
            </View>

            <View className="flex-row items-center gap-2 my-4">
              <View className="flex-1 h-px bg-border" />
              <Text className="text-neutral-500 text-[10px]">o continúa con</Text>
              <View className="flex-1 h-px bg-border" />
            </View>

            <Pressable onPress={handleGoogle} disabled={loading}>
              <Button variant="secondary" disabled={loading}>
                <Ionicons name="logo-google" size={16} color="#ededed" />
                <Text className="text-foreground text-sm font-semibold">Google</Text>
              </Button>
            </Pressable>
          </Card>
        )}

        <Text className="text-neutral-500 text-[11px] text-center">
          Al continuar aceptas que guardemos tus datos en Supabase para sincronizarlos entre dispositivos.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
