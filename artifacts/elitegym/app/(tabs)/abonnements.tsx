import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import EliteButton from "@/components/EliteButton";
import { Feather } from "@expo/vector-icons";

export default function AbonnementsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [formules, setFormules] = useState<any[]>([]);
  const [abonnement, setAbonnement] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState<number | null>(null);

  const load = async () => {
    try {
      const f = await api.get("/abonnements/formules");
      setFormules(f);
      if (user?.id_membre) {
        const a = await api.get(`/abonnements/membre/${user.id_membre}`);
        const actif = a.find((ab: any) => ab.statut === "actif");
        setAbonnement(actif || null);
      }
    } catch {}
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleSouscrire = async (id_formule: number) => {
    if (!user?.id_membre) return;
    setLoading(id_formule);
    try {
      await api.post("/abonnements", {
        id_membre: user.id_membre,
        id_formule,
        date_debut: new Date().toISOString().slice(0, 10),
      });
      Alert.alert("Succès", "Abonnement souscrit et paiement enregistré !");
      load();
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    } finally {
      setLoading(null);
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
      <Text style={[styles.title, { color: colors.foreground }]}>Abonnements</Text>

      {abonnement && (
        <View style={[styles.currentCard, { backgroundColor: colors.primary, }]}>
          <Text style={styles.currentLabel}>Abonnement actif</Text>
          <Text style={styles.currentNom}>{abonnement.nom}</Text>
          <Text style={styles.currentDate}>
            Du {abonnement.date_debut?.slice(0, 10)} au {abonnement.date_fin?.slice(0, 10)}
          </Text>
        </View>
      )}

      <Text style={[styles.section, { color: colors.foreground }]}>Nos formules</Text>

      {formules.map((f: any) => (
        <View key={f.id_formule} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.nom, { color: colors.foreground }]}>{f.nom}</Text>
              <Text style={[styles.duree, { color: colors.mutedForeground }]}>{f.duree_jours} jours</Text>
            </View>
            <Text style={[styles.prix, { color: colors.primary }]}>{Number(f.tarif).toLocaleString()} DA</Text>
          </View>
          <Text style={[styles.desc, { color: colors.mutedForeground }]}>{f.description}</Text>
          {user?.role === "membre" && (
            <EliteButton
              title={abonnement ? "Renouveler" : "Souscrire"}
              onPress={() => handleSouscrire(f.id_formule)}
              loading={loading === f.id_formule}
              variant="primary"
              small
            />
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 14 },
  title: { fontSize: 22, fontWeight: "800" },
  currentCard: { borderRadius: 14, padding: 18, gap: 4 },
  currentLabel: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  currentNom: { color: "#fff", fontSize: 22, fontWeight: "800" },
  currentDate: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  section: { fontSize: 17, fontWeight: "700" },
  card: { borderRadius: 12, padding: 16, gap: 10, borderWidth: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  nom: { fontSize: 17, fontWeight: "700" },
  duree: { fontSize: 13 },
  prix: { fontSize: 20, fontWeight: "900" },
  desc: { fontSize: 13, lineHeight: 20 },
});
