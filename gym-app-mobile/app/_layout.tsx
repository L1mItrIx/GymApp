import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#15181d" },
            headerTintColor: "#ededed",
            headerTitleStyle: { fontWeight: "600" },
            contentStyle: { backgroundColor: "#0b0d10" },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ title: "Configurar perfil" }} />
          <Stack.Screen name="dashboard" options={{ title: "FitForge", headerBackVisible: false }} />
          <Stack.Screen name="routines/new" options={{ title: "Nueva rutina" }} />
          <Stack.Screen name="routines/[id]" options={{ title: "Editar rutina" }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
