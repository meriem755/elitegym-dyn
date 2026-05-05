import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Platform, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import EliteButton from "@/components/EliteButton";
import { Feather } from "@expo/vector-icons";

function StatPill({ label, value, color }: { label: string; value: any; color: string }) {
  return (
    <View style={[p.pill, { backgroundColor: color + "15" }]}>
      <Text style={[p.pillVal, { color }]}>{value}</Text>
      <Text style={[p.pillLabel, { color }]}>{label}</Text>
    </View>
  );
}

export default function ProgressScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [suivis, setSuivis] = useState<any[]>([]);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!user?.id_membre) return;
    try {
      const [s, pr] = await Promise.all([
        api.get(`/progress/membre/${user.id_membre}`),
        api.get(`/exercices/membre/${user.id_membre}`),
      ]);
      setSuivis(s);
      setProgrammes(pr);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  // Graphique poids si plusieurs mesures
  const poidsData = suivis.filter((s: any) => s.poids_kg).slice(-6).reverse();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[p.topBar, { backgroundColor: colors.secondary, paddingTop: Platform.OS === "web" ? 20 : insets.top + 8 }]}>
        <Feather name="trending-up" size={20} color="#fff" />
        <Text style={p.topBarTitle}>Mes Progrès</Text>
      </View>
      <ScrollView contentContainerStyle={[p.content, { paddingBottom: 90 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Dernière mesure */}
            {suivis.length > 0 && (
              <View style={[p.card, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
                <Text style={[p.sectionTitle, { color: colors.foreground }]}>Dernière mesure — {suivis[0].date_mesure?.slice(0,10)}</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {suivis[0].poids_kg && <StatPill label="Poids" value={`${suivis[0].poids_kg} kg`} color={colors.primary} />}
                  {suivis[0].imc && <StatPill label="IMC" value={suivis[0].imc} color="#10b981" />}
                  {suivis[0].tour_taille && <StatPill label="Taille" value={`${suivis[0].tour_taille} cm`} color="#f59e0b" />}
                </View>
                {suivis[0].observations && (
                  <Text style={[p.sub, { color: colors.foreground }]}>📝 {suivis[0].observations}</Text>
                )}
                <Text style={[p.sub, { color: colors.mutedForeground }]}>Par : {suivis[0].coach_nom}</Text>
              </View>
            )}

            {/* Évolution poids */}
            {poidsData.length >= 2 && (
              <View style={[p.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[p.sectionTitle, { color: colors.foreground }]}>Évolution du poids</Text>
                <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, height: 80 }}>
                  {poidsData.map((s: any, i: number) => {
                    const vals = poidsData.map((x: any) => x.poids_kg);
                    const min = Math.min(...vals);
                    const max = Math.max(...vals);
                    const range = max - min || 1;
                    const h = Math.max(10, Math.round(((s.poids_kg - min) / range) * 60) + 10);
                    return (
                      <View key={i} style={{ flex: 1, alignItems: "center", gap: 4 }}>
                        <Text style={{ fontSize: 9, fontWeight: "700", color: colors.primary }}>{s.poids_kg}</Text>
                        <View style={{ height: h, width: "100%", borderRadius: 4, backgroundColor: colors.primary }} />
                        <Text style={{ fontSize: 8, color: colors.mutedForeground }}>{s.date_mesure?.slice(5,10)}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Historique */}
            <Text style={[p.sectionTitle, { color: colors.foreground }]}>Historique des mesures</Text>
            {suivis.length === 0 ? (
              <View style={[p.card, { backgroundColor: colors.card, borderColor: colors.border, alignItems: "center", paddingVertical: 30, gap: 10 }]}>
                <Feather name="trending-up" size={30} color={colors.mutedForeground} />
                <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>Aucune mesure enregistrée.{"\n"}Demandez à votre coach de commencer le suivi.</Text>
              </View>
            ) : suivis.map((s: any) => (
              <View key={s.id_suivi} style={[p.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={[p.sectionTitle, { color: colors.foreground, fontSize: 14 }]}>{s.date_mesure?.slice(0,10)}</Text>
                  <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600" }}>{s.coach_nom}</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {s.poids_kg && <StatPill label="Poids" value={`${s.poids_kg} kg`} color={colors.primary} />}
                  {s.imc && <StatPill label="IMC" value={s.imc} color="#10b981" />}
                  {s.tour_taille && <StatPill label="Tour taille" value={`${s.tour_taille} cm`} color="#f59e0b" />}
                </View>
                {s.observations && <Text style={[p.sub, { color: colors.foreground }]}>📝 {s.observations}</Text>}
              </View>
            ))}

            {/* Programmes */}
            <Text style={[p.sectionTitle, { color: colors.foreground, marginTop: 6 }]}>Programmes d'entraînement</Text>
            {programmes.length === 0 ? (
              <View style={[p.card, { backgroundColor: colors.card, borderColor: colors.border, alignItems: "center", paddingVertical: 30, gap: 10 }]}>
                <Feather name="clipboard" size={30} color={colors.mutedForeground} />
                <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>Aucun programme assigné.{"\n"}Votre coach peut en créer un pour vous.</Text>
              </View>
            ) : programmes.map((pr: any) => (
              <View key={pr.id_programme} style={[p.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[p.sectionTitle, { color: colors.foreground }]}>{pr.titre}</Text>
                <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600" }}>Coach : {pr.coach_nom}</Text>
                {pr.description && <Text style={[p.sub, { color: colors.foreground }]}>{pr.description}</Text>}
                <Text style={[p.sub, { color: colors.mutedForeground }]}>Créé le {pr.date_creation?.slice(0,10)}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const p = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingBottom: 14 },
  topBarTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  content: { padding: 16, gap: 10 },
  card: { borderRadius: 12, padding: 14, gap: 8, borderWidth: 1 },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  sub: { fontSize: 12, lineHeight: 18 },
  pill: { flex: 1, borderRadius: 10, padding: 10, alignItems: "center" },
  pillVal: { fontSize: 18, fontWeight: "900" },
  pillLabel: { fontSize: 11, fontWeight: "600" },
});
