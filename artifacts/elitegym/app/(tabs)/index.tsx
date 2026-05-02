import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  Platform, Alert, TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import CoursCard from "@/components/CoursCard";
import NotifBanner from "@/components/NotifBanner";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function AccueilScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();

  const [cours, setCours] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [abonnement, setAbonnement] = useState<any>(null);
  const [nouveauxCours, setNouveauxCours] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Bannières dismissées
  const [hideExpiryBanner, setHideExpiryBanner] = useState(false);
  const [hideNewCoursBanner, setHideNewCoursBanner] = useState(false);
  const [hideScheduleBanner, setHideScheduleBanner] = useState(false);

  const load = async () => {
    try {
      const c = await api.get("/cours/week");
      setCours(c.slice(0, 5));

      // Compter les cours ajoutés dans les dernières 24h
      const since = Date.now() - 24 * 60 * 60 * 1000;
      const recents = c.filter((cr: any) => {
        const created = new Date(cr.date_creation || cr.date_cours).getTime();
        return created > since;
      });
      setNouveauxCours(recents.length);

      if (user?.id_membre) {
        const [r, a] = await Promise.all([
          api.get(`/reservations/membre/${user.id_membre}`),
          api.get(`/abonnements/membre/${user.id_membre}`),
        ]);
        setReservations(r);
        const actif = a.find((ab: any) => ab.statut === "actif");
        setAbonnement(actif || null);
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
      Alert.alert("Réservé ✓", "Votre place est confirmée !");
      load();
    } catch (e: any) { Alert.alert("Erreur", e.message); }
  };

  const joursRestants = abonnement ? daysUntil(abonnement.date_fin) : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: Platform.OS === "web" ? 90 : insets.top + 16, paddingBottom: 100 },
      ]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View>
          <Text style={[styles.welcome, { color: colors.mutedForeground }]}>Bonjour 👋</Text>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {user?.prenom} {user?.nom}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>{user?.role}</Text>
        </View>
      </View>

      {/* === BANNIÈRES DE NOTIFICATIONS === */}

      {/* Abonnement expirant bientôt */}
      {!hideExpiryBanner && user?.role === "membre" && joursRestants !== null && joursRestants <= 7 && joursRestants > 0 && (
        <NotifBanner
          type="warning"
          message={`Votre abonnement "${abonnement.nom}" expire dans ${joursRestants} jour${joursRestants > 1 ? "s" : ""}. Pensez à le renouveler !`}
          onDismiss={() => setHideExpiryBanner(true)}
          action={{ label: "Renouveler", onPress: () => router.push("/(tabs)/abonnements") }}
        />
      )}

      {/* Abonnement expiré */}
      {!hideExpiryBanner && user?.role === "membre" && joursRestants !== null && joursRestants <= 0 && (
        <NotifBanner
          type="danger"
          message="Votre abonnement a expiré. Renouvelez pour continuer à profiter de la salle."
          onDismiss={() => setHideExpiryBanner(true)}
          action={{ label: "Renouveler", onPress: () => router.push("/(tabs)/abonnements") }}
        />
      )}

      {/* Nouveaux cours cette semaine */}
      {!hideNewCoursBanner && nouveauxCours > 0 && (
        <NotifBanner
          type="info"
          message={`🆕 ${nouveauxCours} nouveau${nouveauxCours > 1 ? "x" : ""} cours ajouté${nouveauxCours > 1 ? "s" : ""} cette semaine. Réservez votre place !`}
          onDismiss={() => setHideNewCoursBanner(true)}
          action={{ label: "Voir", onPress: () => router.push("/(tabs)/planning") }}
        />
      )}

      {/* Planning de la semaine disponible */}
      {!hideScheduleBanner && cours.length > 0 && (
        <NotifBanner
          type="success"
          message={`📅 Le planning de la semaine est disponible — ${cours.length} cours programmés. Consultez les horaires !`}
          onDismiss={() => setHideScheduleBanner(true)}
          action={{ label: "Planning", onPress: () => router.push("/(tabs)/planning") }}
        />
      )}

      {/* Stats */}
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
        {abonnement && joursRestants !== null && (
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/abonnements")}
            style={[styles.statCard, {
              backgroundColor: joursRestants <= 7 ? "#fef3c7" : colors.card,
              borderColor: joursRestants <= 7 ? "#fcd34d" : colors.border,
            }]}
          >
            <Feather name="clock" size={20} color={joursRestants <= 7 ? "#f59e0b" : "#10b981"} />
            <Text style={[styles.statNum, { color: joursRestants <= 7 ? "#f59e0b" : colors.foreground }]}>
              {joursRestants}j
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Abonnement</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Abonnement actif résumé */}
      {abonnement && joursRestants !== null && joursRestants > 0 && (
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/abonnements")}
          style={[styles.aboCard, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.aboLabel}>Abonnement actif</Text>
            <Text style={styles.aboNom}>{abonnement.nom}</Text>
            <Text style={styles.aboDate}>Expire le {abonnement.date_fin?.slice(0, 10)}</Text>
          </View>
          <View style={[styles.aboJours, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
            <Text style={styles.aboJoursNum}>{joursRestants}</Text>
            <Text style={styles.aboJoursLabel}>jours</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Pas d'abonnement */}
      {user?.role === "membre" && !abonnement && !loading && (
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/abonnements")}
          style={[styles.aboCard, { backgroundColor: "#f3f4f6", borderColor: "#e5e7eb", borderWidth: 1 }]}
          activeOpacity={0.85}
        >
          <Feather name="plus-circle" size={24} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.aboNom, { color: colors.primary }]}>Aucun abonnement actif</Text>
            <Text style={[styles.aboDate, { color: colors.mutedForeground }]}>Appuyez pour souscrire en ligne</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}

      {/* Cours de la semaine */}
      <Text style={[styles.section, { color: colors.foreground }]}>Cours cette semaine</Text>

      {loading ? (
        <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 20 }}>Chargement...</Text>
      ) : cours.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="calendar" size={28} color={colors.mutedForeground} />
          <Text style={{ color: colors.mutedForeground }}>Aucun cours cette semaine</Text>
        </View>
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
  container: { paddingHorizontal: 16, gap: 14 },
  hero: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  welcome: { fontSize: 14 },
  name: { fontSize: 24, fontWeight: "800" },
  badge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: "center", gap: 4, borderWidth: 1 },
  statNum: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 10, textAlign: "center" },
  aboCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, padding: 16 },
  aboLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12 },
  aboNom: { color: "#fff", fontSize: 16, fontWeight: "800" },
  aboDate: { color: "rgba(255,255,255,0.75)", fontSize: 12 },
  aboJours: { borderRadius: 10, padding: 10, alignItems: "center", minWidth: 52 },
  aboJoursNum: { color: "#fff", fontSize: 22, fontWeight: "900" },
  aboJoursLabel: { color: "rgba(255,255,255,0.8)", fontSize: 10 },
  section: { fontSize: 18, fontWeight: "800" },
  emptyBox: { borderRadius: 12, padding: 30, alignItems: "center", gap: 10, borderWidth: 1 },
});
