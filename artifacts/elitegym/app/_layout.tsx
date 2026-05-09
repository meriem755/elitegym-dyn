// src/app/_layout.tsx
import {
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NotifProvider } from "@/lib/notifications";

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

const PUBLIC_ROUTES = ["index", "login"];

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  // 🔥 Mémoisation stable de segments pour éviter les re-renders
  const currentRoute = useMemo(() => segments.join("/"), [segments]);

  useEffect(() => {
    // Attendre que le router soit prêt
    if (!navigationState?.key) return;
    if (isLoading) return;

    const seg0 = segments[0] as string | undefined;
    const inTabs = seg0 === "(tabs)";
    const inLogin = seg0 === "login";
    const inCoach = seg0 === "coach";
    const inAdmin = seg0 === "admin";
    const inPublic = !seg0 || PUBLIC_ROUTES.includes(seg0);

    console.log("🧭 Auth guard:", { user: user?.role ?? null, route: currentRoute, inTabs, inLogin });

    // 🔴 Pas de user → rediriger vers login si on est sur une route protégée
    if (!user) {
      if (!inPublic) {
        console.log("🔴 Redirect vers /login (user=null)");
        router.replace("/login");
      }
      return;
    }

    // 🟢 User connecté sur page publique → rediriger vers dashboard
    if (inPublic) {
      if (user.role === "administrateur" || user.role === "gerant" || user.role === "receptionniste") {
        router.replace("/admin");
      } else if (user.role === "coach") {
        router.replace("/coach");
      } else {
        router.replace("/(tabs)");
      }
      return;
    }

    // 🔵 User connecté mais mauvaise section → rediriger
    if (user.role === "administrateur" || user.role === "gerant" || user.role === "receptionniste") {
      if (!inAdmin) router.replace("/admin");
    } else if (user.role === "coach") {
      if (!inCoach) router.replace("/coach");
    } else {
      // membre
      if (!inTabs) {
        console.log("🟡 Redirect membre vers /(tabs)");
        router.replace("/(tabs)");
      }
    }
  }, [user?.id ?? null, isLoading, currentRoute, navigationState?.key]);

  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="coach" />
      <Stack.Screen name="admin" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AuthProvider>
                <NotifProvider>
                  <RootLayoutNav />
                </NotifProvider>
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}