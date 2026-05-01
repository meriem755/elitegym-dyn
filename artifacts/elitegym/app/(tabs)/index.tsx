import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import CoursCard from "@/components/CoursCard";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert } from "react-native";

export default function AccueilScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();
  const [cours, setCours] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const c = await api.get("/cours/week");
      setCours(c.slice(0, 5));
      if (user?.id_membre) {
        const r = await api.get(`/reservations/membre/${user.id_membre}`);
        setReservations(r);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const isReserved = (id_cours: number) =>
    reservations.some((r: any) => r.id_cours === id_cours && r.statut === "confirmee");

  const handleReserver = async (id_cours: number) => {
    if (!user?.id_membre) return;
    try {
      await api.post("/reservations", { id_membre: user.id_membre, id_cours });
      Alert.alert("Succès", "Cours réservé !");
      load();
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    }
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
      <View style={styles.hero}>
        <Text style={[styles.welcome, { color: colors.mutedForeground }]}>Bonjour 👋</Text>
        <Text style={[styles.name, { color: colors.foreground }]}>
          {user?.prenom} {user?.nom}
        </Text>
        <View style={[styles.badge, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>{user?.role}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="calendar" size={20} color={colors.primary} />
          <Text style={[styles.statNum, { color: colors.foreground }]}>{cours.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Cours semaine</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="check-circle" size={20} color="#10b981" />
          <Text style={[styles.statNum, { color: colors.foreground }]}>
            {reservations.filter((r: any) => r.statut === "confirmee").length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Réservations</Text>
        </View>
      </View>

      <Text style={[styles.section, { color: colors.foreground }]}>Cours cette semaine</Text>
      {loading ? (
        <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 20 }}>Chargement...</Text>
      ) : cours.length === 0 ? (
        <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 20 }}>Aucun cours cette semaine</Text>
      ) : (
        cours.map((c: any) => (
          <CoursCard
            key={c.id_cours}
            cours={c}
            reserved={isReserved(c.id_cours)}
            showActions={user?.role === "membre"}
            onReserver={() => handleReserver(c.id_cours)}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 16 },
  hero: { gap: 4 },
  welcome: { fontSize: 14 },
  name: { fontSize: 24, fontWeight: "800" },
  badge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },
  statNum: { fontSize: 24, fontWeight: "800" },
  statLabel: { fontSize: 12, textAlign: "center" },
  section: { fontSize: 18, fontWeight: "800", marginTop: 4 },
});
