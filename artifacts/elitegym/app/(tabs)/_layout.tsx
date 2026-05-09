import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Platform, StyleSheet, View, Text, useColorScheme,
  TouchableOpacity, Modal, ScrollView,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useNotifs } from "@/lib/notifications";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const NOTIF_TYPE_META: Record<string, { icon: string; color: string }> = {
  abonnement:  { icon: "tag",           color: "#10b981" },
  paiement:    { icon: "dollar-sign",   color: "#10b981" },
  cours:       { icon: "calendar",      color: "#3b82f6" },
  reservation: { icon: "check-square",  color: "#8b5cf6" },
  programme:   { icon: "clipboard",     color: "#f59e0b" },
  coach:       { icon: "user",          color: "#0ea5e9" },
  message:     { icon: "message-circle",color: "#0ea5e9" },
  alerte:      { icon: "alert-circle",  color: "#ef4444" },
};

function getNotifMeta(type: string) {
  const key = Object.keys(NOTIF_TYPE_META).find(k => type?.toLowerCase().includes(k));
  return key ? NOTIF_TYPE_META[key] : { icon: "bell", color: "#6b7280" };
}

function NotifBell() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { notifs, unread, markAllRead } = useNotifs();
  const [showModal, setShowModal] = useState(false);

  const open = () => { setShowModal(true); markAllRead(); };

  return (
    <>
      <TouchableOpacity onPress={open} style={{ marginRight: 16, position: "relative", padding: 4 }} activeOpacity={0.7}>
        <Feather name="bell" size={22} color="#ffffff" />
        {unread > 0 && (
          <View style={{ position: "absolute", top: 0, right: 0, backgroundColor: "#E63946", borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 }}>
            <Text style={{ color: "#fff", fontSize: 9, fontWeight: "900" }}>{unread}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: insets.bottom + 24, maxHeight: "85%" }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 16 }} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>Mes notifications</Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>Abonnements · Paiements · Cours · Programmes</Text>
              </View>
              <TouchableOpacity onPress={() => setShowModal(false)} style={{ padding: 4 }}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {notifs.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 48, gap: 12 }}>
                  <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }}>
                    <Feather name="bell" size={28} color={colors.mutedForeground} />
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>Aucune notification</Text>
                  <Text style={{ fontSize: 13, color: colors.mutedForeground, textAlign: "center" }}>Vous serez notifié des mises à jour de votre abonnement, paiements et cours.</Text>
                </View>
              ) : notifs.map((n) => {
                const meta = getNotifMeta(n.type_notif || "");
                return (
                  <View key={n.id} style={{ flexDirection: "row", gap: 12, borderRadius: 12, padding: 12, marginBottom: 8, backgroundColor: n.read ? colors.background : meta.color + "10", borderWidth: 1, borderColor: n.read ? colors.border : meta.color + "40" }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: meta.color + "20", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Feather name={meta.icon as any} size={16} color={meta.color} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground }}>{n.contenu}</Text>
                      <Text style={{ fontSize: 11, color: colors.mutedForeground }}>{new Date(n.at).toLocaleString("fr-FR")}</Text>
                    </View>
                    {!n.read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: meta.color, marginTop: 4, flexShrink: 0 }} />}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function TabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const { user } = useAuth();
  const isMembre = user?.role === "membre";

  // ✅ Garde : bloque le rendu des tabs pendant la déconnexion
  if (!user) {
  // Laisser RootLayoutNav gérer la redirection
  return <View style={{ flex: 1, backgroundColor: colors.background }} />;
}

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: true,
        headerStyle: { backgroundColor: colors.secondary },
        headerTintColor: "#ffffff",
        headerTitleStyle: { fontWeight: "800", fontSize: 16, color: "#ffffff" },
        headerRight: () => <NotifBell />,
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
      <Tabs.Screen name="index" options={{ title: "Accueil", tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} /> }} />
      <Tabs.Screen name="planning" options={{ title: "Planning", tabBarIcon: ({ color }) => <Feather name="calendar" size={22} color={color} /> }} />
      <Tabs.Screen name="abonnements" options={{ title: "Paiements", href: isMembre ? undefined : null, tabBarIcon: ({ color }) => <Feather name="credit-card" size={22} color={color} /> }} />
      <Tabs.Screen name="presence" options={{ title: "Présence", href: isMembre ? undefined : null, tabBarIcon: ({ color }) => <Feather name="bar-chart-2" size={22} color={color} /> }} />
      <Tabs.Screen name="calculateur" options={{ title: "Calculateur", tabBarIcon: ({ color }) => <Feather name="activity" size={22} color={color} /> }} />
      <Tabs.Screen name="progress" options={{ title: "Progrès", href: isMembre ? undefined : null, tabBarIcon: ({ color }) => <Feather name="trending-up" size={22} color={color} /> }} />
      <Tabs.Screen name="profil" options={{ title: "Profil", tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} /> }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="coachs" options={{ href: null }} />
      <Tabs.Screen name="boutique" options={{ href: null }} />
      <Tabs.Screen name="contact" options={{ href: null }} />
    </Tabs>
  );
}