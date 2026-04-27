import { useEffect } from "react";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { useAuth } from "@/components/AuthGate";
import { getProfile } from "@/lib/data";

export default function IndexScreen() {
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    (async () => {
      if (!session) {
        router.replace("/(auth)/login");
        return;
      }
      try {
        const profile = await getProfile(session.user.id);
        if (!profile) {
          router.replace("/onboarding");
        } else {
          router.replace("/(app)/today");
        }
      } catch {
        // If profile lookup fails (e.g. schema not run), still take user somewhere.
        router.replace("/onboarding");
      }
    })();
  }, [loading, session, router]);

  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-neutral-400">Cargando...</Text>
    </View>
  );
}
