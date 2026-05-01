import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";
import { Feather } from "@expo/vector-icons";

export default function CoachsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [coachs, setCoachs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await api.get("/coachs");
      setCoachs(data);
    } catch {}
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const SPECIALITES_COLORS: Record<string, string> = {
    "Musculation & Force": "#E63946",
    "CrossFit & HIIT": "#f59e0b",
    "Yoga & Bien-être": "#10b981",
    "Cardio & Zumba": "#8b5cf6",
    "Boxe & Arts Martiaux": "#3b82f6",
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: Platform.OS === "web" ? 90 : insets.top + 16, paddingBottom: 100 },
      ]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Notre équipe</Text>

      {coachs.map((c: any) => {
        const clr = SPECIALITES_COLORS[c.specialite] || colors.primary;
        return (
          <View key={c.id_coach} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: clr + "20" }]}>
              <Text style={[styles.avatarText, { color: clr }]}>
                {c.prenom?.[0]}{c.nom?.[0]}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.foreground }]}>{c.prenom} {c.nom}</Text>
              <View style={[styles.badge, { backgroundColor: clr + "20" }]}>
                <Text style={[styles.badgeText, { color: clr }]}>{c.specialite}</Text>
              </View>
              <View style={styles.row}>
                <Feather name="calendar" size={12} color={colors.mutedForeground} />
                <Text style={[styles.info, { color: colors.mutedForeground }]}>
                  Depuis {c.date_embauche?.slice(0, 10)}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: "800" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "800" },
  name: { fontSize: 16, fontWeight: "700" },
  badge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  info: { fontSize: 12 },
});
