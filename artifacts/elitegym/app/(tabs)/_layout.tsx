import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, Text, useColorScheme } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

export default function TabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const { user } = useAuth();
  const isMembre = user?.role === "membre";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          height: isWeb ? 70 : 60,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600", marginBottom: isWeb ? 6 : 2 },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ),
      }}
    >
      {/* Accueil */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} />,
        }}
      />
      {/* Planning */}
      <Tabs.Screen
        name="planning"
        options={{
          title: "Planning",
          tabBarIcon: ({ color }) => <Feather name="calendar" size={22} color={color} />,
        }}
      />
      {/* Paiements — membre uniquement dans la barre */}
      <Tabs.Screen
        name="abonnements"
        options={{
          title: "Paiements",
          href: isMembre ? undefined : null,
          tabBarIcon: ({ color }) => <Feather name="credit-card" size={22} color={color} />,
        }}
      />
      {/* Présence — membre uniquement */}
      <Tabs.Screen
        name="presence"
        options={{
          title: "Présence",
          href: isMembre ? undefined : null,
          tabBarIcon: ({ color }) => <Feather name="bar-chart-2" size={22} color={color} />,
        }}
      />
      {/* Progrès — membre uniquement */}
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progrès",
          href: isMembre ? undefined : null,
          tabBarIcon: ({ color }) => <Feather name="trending-up" size={22} color={color} />,
        }}
      />
      {/* Profil */}
      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} />,
        }}
      />
      {/* Tabs cachés */}
      <Tabs.Screen name="calculateur" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="coachs" options={{ href: null }} />
      <Tabs.Screen name="boutique" options={{ href: null }} />
      <Tabs.Screen name="contact" options={{ href: null }} />
    </Tabs>
  );
}
