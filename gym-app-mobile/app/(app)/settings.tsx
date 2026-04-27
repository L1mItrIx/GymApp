import { useEffect, useState, type ReactNode } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { Link, useRouter } from "expo-router";
import { Button, Card, Input, Label } from "@/components/ui";
import { useAuth } from "@/components/AuthGate";
import {
  getProfile,
  upsertProfile,
  type ProfileRow,
} from "@/lib/data";
import {
  getWeightUnit,
  getWeekStart,
  setWeightUnit,
  setWeekStart,
  type WeekStart,
  type WeightUnit,
} from "@/lib/preferences";
import { supabase } from "@/lib/supabase";

const GOAL_LABELS: Record<ProfileRow["goal"], string> = {
  hypertrophy: "Hipertrofia",
  strength: "Fuerza",
  weight_loss: "Pérdida de peso",
  endurance: "Resistencia",
  general_fitness: "Estado físico general",
};

const EXP_LABELS: Record<ProfileRow["experience"], string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

export default function SettingsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [weight, setWeight] = useState<WeightUnit>("kg");
  const [week, setWeek] = useState<WeekStart>("monday");

  useEffect(() => {
    if (!session) return;
    (async () => {
      const p = await getProfile(session.user.id).catch(() => null);
      if (p) setProfile(p);
      setWeight(await getWeightUnit());
      setWeek(await getWeekStart());
    })();
  }, [session]);

  const signOut = () => {
    Alert.alert("Cerrar sesión", "¿Seguro que quieres salir?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const clearAgenda = () => {
    Alert.alert(
      "Borrar agenda",
      "Esto eliminará todos los ejercicios de tu agenda y marcará los 7 días como descanso. ¿Continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar",
          style: "destructive",
          onPress: async () => {
            if (!session) return;
            const { data: plan } = await supabase
              .from("plans")
              .select("id")
              .eq("user_id", session.user.id)
              .eq("is_active", true)
              .maybeSingle();
            if (!plan) return;
            const { data: days } = await supabase
              .from("plan_days")
              .select("id")
              .eq("plan_id", (plan as { id: string }).id);
            const dayIds = (days ?? []).map((d: { id: string }) => d.id);
            if (dayIds.length) {
              await supabase.from("plan_exercises").delete().in("plan_day_id", dayIds);
              await supabase
                .from("plan_days")
                .update({ is_rest: true, name: null, focus: [] as string[] })
                .in("id", dayIds);
            }
            Alert.alert("Listo", "Tu agenda ha quedado vacía.");
          },
        },
      ]
    );
  };

  const clearSessions = () => {
    Alert.alert(
      "Borrar sesiones registradas",
      "Esto eliminará TODO tu historial de progreso (pesos, reps, fechas). No se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar todo",
          style: "destructive",
          onPress: async () => {
            if (!session) return;
            await supabase.from("workout_sessions").delete().eq("user_id", session.user.id);
            Alert.alert("Listo", "Historial eliminado.");
          },
        },
      ]
    );
  };

  const onWeight = async (v: WeightUnit) => {
    setWeight(v);
    await setWeightUnit(v);
  };
  const onWeek = async (v: WeekStart) => {
    setWeek(v);
    await setWeekStart(v);
  };

  return (
    <>
      <ScrollView contentContainerClassName="px-4 py-5 gap-5" className="bg-background">
        <View>
          <Text className="text-foreground text-2xl font-bold">Ajustes</Text>
          <Text className="text-neutral-400 text-sm mt-1">
            {session?.user.email}
          </Text>
        </View>

        {/* Cuenta */}
        <Section title="Cuenta">
          <Row
            icon="mail-outline"
            label="Email"
            value={session?.user.email ?? ""}
            disabled
          />
          <Row
            icon="key-outline"
            label="Cambiar contraseña"
            onPress={() => setShowPasswordModal(true)}
          />
          <Row
            icon="log-out-outline"
            label="Cerrar sesión"
            onPress={signOut}
            danger
          />
        </Section>

        {/* Perfil */}
        <Section title="Mi perfil">
          {profile ? (
            <>
              <Row icon="person-outline" label="Nombre" value={profile.name} />
              <Row
                icon="flame-outline"
                label="Objetivo"
                value={GOAL_LABELS[profile.goal]}
              />
              <Row
                icon="trophy-outline"
                label="Experiencia"
                value={EXP_LABELS[profile.experience]}
              />
              <Row
                icon="calendar-outline"
                label="Días por semana"
                value={`${profile.days_per_week} días`}
              />
              <Row
                icon="create-outline"
                label="Editar perfil"
                onPress={() => setShowProfileEdit(true)}
              />
            </>
          ) : (
            <Text className="text-neutral-500 text-sm py-3 px-3">Cargando...</Text>
          )}
        </Section>

        {/* Preferencias */}
        <Section title="Preferencias">
          <ToggleRow
            icon="barbell-outline"
            label="Unidad de peso"
            options={[
              { value: "kg", label: "kg" },
              { value: "lb", label: "lb" },
            ]}
            selected={weight}
            onChange={(v) => onWeight(v as WeightUnit)}
          />
          <ToggleRow
            icon="calendar-clear-outline"
            label="Inicio de semana"
            options={[
              { value: "monday", label: "Lun" },
              { value: "sunday", label: "Dom" },
            ]}
            selected={week}
            onChange={(v) => onWeek(v as WeekStart)}
          />
        </Section>

        {/* Análisis */}
        <Section title="Más">
          <Link href="/(app)/analysis" asChild>
            <Pressable>
              <Row icon="speedometer-outline" label="Análisis de optimización" />
            </Pressable>
          </Link>
        </Section>

        {/* Datos */}
        <Section title="Datos">
          <Row
            icon="trash-bin-outline"
            label="Borrar agenda"
            onPress={clearAgenda}
            danger
          />
          <Row
            icon="trash-outline"
            label="Borrar historial de sesiones"
            onPress={clearSessions}
            danger
          />
        </Section>

        {/* Acerca */}
        <Section title="Acerca">
          <Row
            icon="information-circle-outline"
            label="Versión"
            value={Constants.expoConfig?.version ?? "1.0.0"}
            disabled
          />
          <Row
            icon="cloud-outline"
            label="Almacenamiento"
            value="Supabase"
            disabled
          />
        </Section>

        <View className="h-8" />
      </ScrollView>

      {/* Profile edit modal */}
      <ProfileEditModal
        visible={showProfileEdit}
        profile={profile}
        userId={session?.user.id ?? null}
        onClose={() => setShowProfileEdit(false)}
        onSaved={(updated) => {
          setProfile(updated);
          setShowProfileEdit(false);
        }}
      />

      {/* Password modal */}
      <PasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </>
  );
}

// ---------- Sub-components ----------
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View>
      <Text className="text-[10px] uppercase tracking-wider text-neutral-500 mb-2 px-1">
        {title}
      </Text>
      <Card className="p-0 overflow-hidden">{children}</Card>
    </View>
  );
}

function Row({
  icon,
  label,
  value,
  onPress,
  disabled,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  const inner = (
    <View
      className={[
        "flex-row items-center gap-3 px-3 py-3 border-b border-border",
      ].join(" ")}
    >
      <Ionicons
        name={icon}
        size={18}
        color={danger ? "#fca5a5" : "#a5b4fc"}
      />
      <Text
        className={[
          "flex-1 text-sm",
          danger ? "text-red-300" : "text-foreground",
        ].join(" ")}
        numberOfLines={1}
      >
        {label}
      </Text>
      {value !== undefined && (
        <Text className="text-neutral-400 text-sm" numberOfLines={1}>
          {value}
        </Text>
      )}
      {onPress && !disabled && (
        <Ionicons name="chevron-forward" size={14} color="#6b7280" />
      )}
    </View>
  );

  if (!onPress || disabled) return inner;
  return <Pressable onPress={onPress}>{inner}</Pressable>;
}

function ToggleRow<T extends string>({
  icon,
  label,
  options,
  selected,
  onChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  options: { value: T; label: string }[];
  selected: T;
  onChange: (v: T) => void;
}) {
  return (
    <View className="flex-row items-center gap-3 px-3 py-2.5 border-b border-border">
      <Ionicons name={icon} size={18} color="#a5b4fc" />
      <Text className="flex-1 text-foreground text-sm">{label}</Text>
      <View className="flex-row bg-surface-2 rounded-md border border-border p-0.5">
        {options.map((o) => {
          const active = selected === o.value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              className={[
                "px-3 py-1 rounded",
                active ? "bg-indigo-500" : "",
              ].join(" ")}
            >
              <Text
                className={[
                  "text-xs",
                  active ? "text-white font-semibold" : "text-neutral-400",
                ].join(" ")}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ProfileEditModal({
  visible,
  profile,
  userId,
  onClose,
  onSaved,
}: {
  visible: boolean;
  profile: ProfileRow | null;
  userId: string | null;
  onClose: () => void;
  onSaved: (p: ProfileRow) => void;
}) {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState<ProfileRow["goal"]>("hypertrophy");
  const [experience, setExperience] = useState<ProfileRow["experience"]>("beginner");
  const [days, setDays] = useState(4);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile && visible) {
      setName(profile.name);
      setGoal(profile.goal);
      setExperience(profile.experience);
      setDays(profile.days_per_week);
      setError(null);
    }
  }, [profile, visible]);

  const save = async () => {
    if (!userId || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await upsertProfile({
        id: userId,
        name: name.trim(),
        goal,
        experience,
        days_per_week: days,
      });
      onSaved({
        id: userId,
        name: name.trim(),
        goal,
        experience,
        days_per_week: days,
        created_at: profile?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <Pressable onPress={onClose}>
            <Text className="text-neutral-400 text-sm">Cancelar</Text>
          </Pressable>
          <Text className="text-foreground font-semibold">Editar perfil</Text>
          <Pressable onPress={save} disabled={saving || !name.trim()}>
            <Text
              className={[
                "text-sm font-semibold",
                saving || !name.trim() ? "text-neutral-600" : "text-indigo-300",
              ].join(" ")}
            >
              {saving ? "..." : "Guardar"}
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerClassName="px-4 py-5 gap-4">
          <View>
            <Label>Nombre</Label>
            <Input value={name} onChangeText={setName} />
          </View>

          <View>
            <Label>Objetivo</Label>
            <View className="gap-1.5">
              {(Object.keys(GOAL_LABELS) as ProfileRow["goal"][]).map((g) => {
                const active = goal === g;
                return (
                  <Pressable
                    key={g}
                    onPress={() => setGoal(g)}
                    className={[
                      "px-3 py-2 rounded-md border",
                      active ? "bg-indigo-500/15 border-indigo-500/40" : "bg-surface-2 border-border",
                    ].join(" ")}
                  >
                    <Text
                      className={[
                        "text-sm",
                        active ? "text-indigo-200" : "text-foreground",
                      ].join(" ")}
                    >
                      {GOAL_LABELS[g]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View>
            <Label>Experiencia</Label>
            <View className="gap-1.5">
              {(Object.keys(EXP_LABELS) as ProfileRow["experience"][]).map((e) => {
                const active = experience === e;
                return (
                  <Pressable
                    key={e}
                    onPress={() => setExperience(e)}
                    className={[
                      "px-3 py-2 rounded-md border",
                      active ? "bg-indigo-500/15 border-indigo-500/40" : "bg-surface-2 border-border",
                    ].join(" ")}
                  >
                    <Text
                      className={[
                        "text-sm",
                        active ? "text-indigo-200" : "text-foreground",
                      ].join(" ")}
                    >
                      {EXP_LABELS[e]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View>
            <Label>Días por semana</Label>
            <View className="flex-row gap-1.5">
              {[2, 3, 4, 5, 6].map((n) => {
                const active = days === n;
                return (
                  <Pressable
                    key={n}
                    onPress={() => setDays(n)}
                    className={[
                      "flex-1 py-2 rounded-md border items-center",
                      active ? "bg-indigo-500/15 border-indigo-500/40" : "bg-surface-2 border-border",
                    ].join(" ")}
                  >
                    <Text
                      className={[
                        "text-sm font-medium",
                        active ? "text-indigo-200" : "text-foreground",
                      ].join(" ")}
                    >
                      {n}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {error && <Text className="text-red-400 text-xs">{error}</Text>}

          <View className="h-8" />
        </ScrollView>
      </View>
    </Modal>
  );
}

function PasswordModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setPassword("");
      setConfirm("");
      setError(null);
      setInfo(null);
    }
  }, [visible]);

  const change = async () => {
    setError(null);
    setInfo(null);
    if (password.length < 6) {
      setError("Mínimo 6 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setInfo("Contraseña actualizada.");
      setTimeout(onClose, 800);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cambiar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <Pressable onPress={onClose}>
            <Text className="text-neutral-400 text-sm">Cancelar</Text>
          </Pressable>
          <Text className="text-foreground font-semibold">Cambiar contraseña</Text>
          <View className="w-16" />
        </View>

        <ScrollView contentContainerClassName="px-4 py-5 gap-4">
          <View>
            <Label>Nueva contraseña</Label>
            <Input
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Mínimo 6 caracteres"
            />
          </View>
          <View>
            <Label>Confirmar contraseña</Label>
            <Input
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              placeholder="Repite la contraseña"
            />
          </View>

          {error && <Text className="text-red-400 text-xs">{error}</Text>}
          {info && <Text className="text-emerald-400 text-xs">{info}</Text>}

          <Pressable onPress={change} disabled={saving}>
            <Button disabled={saving}>
              <Text className="text-white text-sm font-semibold">
                {saving ? "Guardando..." : "Cambiar contraseña"}
              </Text>
            </Button>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}
