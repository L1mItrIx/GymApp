import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Text, View } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthState {
  session: Session | null;
  loading: boolean;
}

const Ctx = createContext<AuthState>({ session: null, loading: true });

export function useAuth() {
  return useContext(Ctx);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-neutral-400">Cargando...</Text>
      </View>
    );
  }

  return <Ctx.Provider value={{ session, loading }}>{children}</Ctx.Provider>;
}
