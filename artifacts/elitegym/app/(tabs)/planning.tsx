import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  Platform, TouchableOpacity, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import CoursCard from "@/components/CoursCard";
import NotifBanner from "@/components/NotifBanner";
import { Feather } from "@expo/vector-icons";

const DAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export default function PlanningScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [cours, setCours] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hideNewBanner, setHideNewBanner] = useState(false);
  const [nouveauxCours, setNouveauxCours] = useState<any[]>([]);

  const load = async () => {
    try {
      const c = await api.get("/cours/week");
      setCours(c);

      // Cours créés dans les dernières 48h
      const since = Date.now() - 48 * 60 * 60 * 1000;
      const recents = c.filter((cr: any) => {
        const d = new Date(cr.date_creation || cr.date_cours).getTime();
        return d > since;
      });
      setNouveauxCours(recents);

      if (user?.id_membre) {
        const r = await api.get(`/reservations/membre/${user.id_membre}`);
        setReservations(r);
      }
    } catch {}
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  // Générer les 7 prochains jours
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  const filtered = selectedDay
    ? cours.filter((c: any) => c.date_cours.slice(0, 10) === selectedDay)
    : cours;

  const isReserved = (id_cours: number) =>
    reservations.some((r: any) => r.id_cours === id_cours && r.statut === "confirmee");

  const getResId = (id_cours: number) =>
    reservations.find((r: any) => r.id_cours === id_cours && r.statut === "confirmee")?.id_reservation;

  const handleReserver = async (id_cours: number) => {
    if (!user?.id_membre) return;
    try {
      await api.post("/reservations", { id_membre: user.id_membre, id_cours });
      Alert.alert("Réservé ✓", "Votre place est confirmée !");
      load();
    } catch (e: any) { Alert.alert("Erreur", e.message); }
  };

  const handleAnnuler = async (id_cours: number) => {
    const id = getResId(id_cours);
    if (!id) return;
    try {
      await api.put(`/reservations/${id}/annuler`);
      Alert.alert("Annulé", "Réservation annulée");
      load();
    } catch (e: any) { Alert.alert("Erreur", e.message); }
  };

  // Regrouper les cours par jour pour le résumé hebdomadaire
  const coursParJour = days.reduce<Record<string, number>>((acc, d) => {
    acc[d] = cours.filter((c: any) => c.date_cours.slice(0, 10) === d).length;
    return acc;
  }, {});

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: Platform.OS === "web" ? 90 : insets.top + 16, paddingBottom: 100 },
      ]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Planning de la semaine</Text>

      {/* Bannière nouveaux cours */}
      {!hideNewBanner && nouveauxCours.length > 0 && (
        <NotifBanner
          type="info"
          message={`🆕 ${nouveauxCours.length} nouveau${nouveauxCours.length > 1 ? "x" : ""} cours ajouté${nouveauxCours.length > 1 ? "s" : ""} récemment : ${nouveauxCours.map((c: any) => c.type_cours).join(", ")}`}
          onDismiss={() => setHideNewBanner(true)}
        />
      )}

      {/* Résumé hebdomadaire */}
      {cours.length > 0 && (
        <View style={[styles.weekSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.weekHeader}>
            <Feather name="calendar" size={14} color={colors.primary} />
            <Text style={[styles.weekTitle, { color: colors.foreground }]}>Résumé de la semaine</Text>
            <Text style={[styles.weekTotal, { color: colors.primary }]}>{cours.length} cours</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekRow}>
            {days.map((d) => {
              const dateObj = new Date(d + "T12:00:00");
              const count = coursParJour[d] || 0;
              const isSelected = selectedDay === d;
              const isToday = d === new Date().toISOString().slice(0, 10);
              return (
                <TouchableOpacity
                  key={d}
                  onPress={() => setSelectedDay(isSelected ? null : d)}
                  style={[
                    styles.weekDay,
                    isSelected && { backgroundColor: colors.primary },
                    isToday && !isSelected && { borderColor: colors.primary, borderWidth: 1.5 },
                  ]}
                >
                  <Text style={[styles.weekDayLabel, { color: isSelected ? "rgba(255,255,255,0.8)" : colors.mutedForeground }]}>
                    {DAYS_FR[dateObj.getDay()]}
                  </Text>
                  <Text style={[styles.weekDayNum, { color: isSelected ? "#fff" : (isToday ? colors.primary : colors.foreground) }]}>
                    {dateObj.getDate()}
                  </Text>
                  {count > 0 ? (
                    <View style={[styles.weekDayBadge, { backgroundColor: isSelected ? "rgba(255,255,255,0.3)" : colors.primary + "20" }]}>
                      <Text style={[styles.weekDayBadgeText, { color: isSelected ? "#fff" : colors.primary }]}>{count}</Text>
                    </View>
                  ) : (
                    <View style={styles.weekDayEmpty} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Filtres rapides */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        <TouchableOpacity
          onPress={() => setSelectedDay(null)}
          style={[styles.filterBtn, !selectedDay && { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.filterText, { color: !selectedDay ? "#fff" : colors.mutedForeground }]}>Tous</Text>
        </TouchableOpacity>
        {days.map((d) => {
          const dateObj = new Date(d + "T12:00:00");
          const isSelected = selectedDay === d;
          const count = coursParJour[d] || 0;
          if (count === 0) return null;
          return (
            <TouchableOpacity
              key={d}
              onPress={() => setSelectedDay(isSelected ? null : d)}
              style={[styles.filterBtn, isSelected && { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.filterDayLabel, { color: isSelected ? "rgba(255,255,255,0.8)" : colors.mutedForeground }]}>
                {DAYS_FR[dateObj.getDay()]}
              </Text>
              <Text style={[styles.filterDayNum, { color: isSelected ? "#fff" : colors.foreground }]}>
                {dateObj.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Liste des cours */}
      {filtered.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="calendar" size={32} color={colors.mutedForeground} />
          <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>
            Aucun cours {selectedDay ? "ce jour" : "cette semaine"}
          </Text>
        </View>
      ) : (
        filtered.map((c: any) => (
          <CoursCard
            key={c.id_cours}
            cours={c}
            reserved={isReserved(c.id_cours)}
            showActions={user?.role === "membre"}
            onReserver={() => handleReserver(c.id_cours)}
            onAnnuler={() => handleAnnuler(c.id_cours)}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 14 },
  title: { fontSize: 22, fontWeight: "800" },
  weekSummary: { borderRadius: 14, padding: 14, gap: 10, borderWidth: 1 },
  weekHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  weekTitle: { flex: 1, fontSize: 13, fontWeight: "700" },
  weekTotal: { fontSize: 13, fontWeight: "800" },
  weekRow: { gap: 8 },
  weekDay: {
    width: 48, alignItems: "center", padding: 8, borderRadius: 10,
    gap: 4, backgroundColor: "#f3f4f6",
  },
  weekDayLabel: { fontSize: 10, fontWeight: "600" },
  weekDayNum: { fontSize: 16, fontWeight: "800" },
  weekDayBadge: { borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1, minWidth: 18, alignItems: "center" },
  weekDayBadgeText: { fontSize: 10, fontWeight: "800" },
  weekDayEmpty: { height: 16 },
  filters: { gap: 8, paddingVertical: 2 },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    alignItems: "center", backgroundColor: "#f3f4f6", minWidth: 52,
  },
  filterText: { fontWeight: "700", fontSize: 13 },
  filterDayLabel: { fontSize: 11, fontWeight: "600" },
  filterDayNum: { fontSize: 15, fontWeight: "800" },
  empty: { borderRadius: 12, padding: 30, alignItems: "center", gap: 10, borderWidth: 1 },
});
