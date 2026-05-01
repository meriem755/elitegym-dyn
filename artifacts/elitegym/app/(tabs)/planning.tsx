import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Platform, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import CoursCard from "@/components/CoursCard";
import { Alert } from "react-native";

const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export default function PlanningScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [cours, setCours] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const c = await api.get("/cours/week");
      setCours(c);
      if (user?.id_membre) {
        const r = await api.get(`/reservations/membre/${user.id_membre}`);
        setReservations(r);
      }
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }

  const filtered = selectedDay ? cours.filter((c: any) => c.date_cours.slice(0, 10) === selectedDay) : cours;

  const isReserved = (id_cours: number) =>
    reservations.some((r: any) => r.id_cours === id_cours && r.statut === "confirmee");

  const getResId = (id_cours: number) =>
    reservations.find((r: any) => r.id_cours === id_cours && r.statut === "confirmee")?.id_reservation;

  const handleReserver = async (id_cours: number) => {
    if (!user?.id_membre) return;
    try {
      await api.post("/reservations", { id_membre: user.id_membre, id_cours });
      Alert.alert("Succès", "Réservation confirmée !");
      load();
    } catch (e: any) { Alert.alert("Erreur", e.message); }
  };

  const handleAnnuler = async (id_cours: number) => {
    const id = getResId(id_cours);
    if (!id) return;
    try {
      await api.put(`/reservations/${id}/annuler`);
      Alert.alert("Succès", "Réservation annulée");
      load();
    } catch (e: any) { Alert.alert("Erreur", e.message); }
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
      <Text style={[styles.title, { color: colors.foreground }]}>Planning de la semaine</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
        <TouchableOpacity
          onPress={() => setSelectedDay(null)}
          style={[styles.dayBtn, !selectedDay && { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.dayText, { color: selectedDay ? colors.mutedForeground : "#fff" }]}>Tous</Text>
        </TouchableOpacity>
        {days.map((d) => {
          const dateObj = new Date(d + "T12:00:00");
          const isSelected = selectedDay === d;
          return (
            <TouchableOpacity
              key={d}
              onPress={() => setSelectedDay(isSelected ? null : d)}
              style={[styles.dayBtn, isSelected && { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.dayLabel, { color: isSelected ? "#fff" : colors.mutedForeground }]}>
                {DAYS[dateObj.getDay()]}
              </Text>
              <Text style={[styles.dayNum, { color: isSelected ? "#fff" : colors.foreground }]}>
                {dateObj.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {filtered.length === 0 ? (
        <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 40 }}>
          Aucun cours ce jour
        </Text>
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
  dayRow: { gap: 8, paddingVertical: 4 },
  dayBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    minWidth: 52,
  },
  dayText: { fontWeight: "700", fontSize: 13 },
  dayLabel: { fontSize: 11, fontWeight: "600" },
  dayNum: { fontSize: 16, fontWeight: "800" },
});
