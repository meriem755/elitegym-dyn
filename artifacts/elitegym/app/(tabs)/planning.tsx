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
  const [loading, setLoading] = useState(true);

  // 🔥 Helper: normaliser date YYYY-MM-DD
  const normalizeDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "";
    return dateStr.slice(0, 10);
  };

  // 🔥 Helper: normaliser heure HH:MM
  const normalizeTime = (timeStr: string | null | undefined): string => {
    if (!timeStr) return "";
    return timeStr.slice(0, 5);
  };

  // 🔥 Helper: créer clé unique basée sur date+heure+salle+coach
  const makeUniqueKey = (cours: any) => {
    return `${normalizeDate(cours.date_cours)}|${normalizeTime(cours.heure_debut)}|${cours.salle || ''}|${cours.id_coach || ''}`;
  };

  const load = async () => {
    try {
      const c = await api.get("/cours/week");
      
      console.log("📦 Cours bruts reçus:", c.length);
      
      // 🔥 Dédupliquer par date+heure+salle+coach
      const seenKeys = new Set<string>();
      const coursUniques = c.filter((cours: any) => {
        const key = makeUniqueKey(cours);
        if (seenKeys.has(key)) {
          console.log("⚠️ Doublon filtré:", key);
          return false;
        }
        seenKeys.add(key);
        return true;
      });
      
      // Ajouter reservationKey aux cours uniques
      const coursAvecKey = coursUniques.map((cours: any) => ({
        ...cours,
        reservationKey: user?.id_membre ? `${cours.id_cours}_${user.id_membre}` : null,
        dateNormalized: normalizeDate(cours.date_cours),
        timeNormalized: normalizeTime(cours.heure_debut)
      }));
      
      console.log("✅ Cours après déduplication:", coursAvecKey.length);
      setCours(coursAvecKey);

      if (user?.id_membre) {
        const r = await api.get(`/reservations/membre/${user.id_membre}`);
        
        // Créer un Set des IDs de cours réservés (statut = confirmee)
        const confirmedReservations = new Set(
          r
            .filter((res: any) => res.statut === "confirmee")
            .map((res: any) => `${res.id_cours}_${user!.id_membre}`)
        );
        
        console.log("📋 Réservations confirmées:", confirmedReservations.size);
        (window as any).__confirmedReservations = confirmedReservations;
        setReservations(r);
      }
    } catch (e) {
      console.error("🔴 [PLANNING] Erreur load:", e);
    }
    setLoading(false);
  };

  useEffect(() => { 
    load(); 
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Générer les 7 prochains jours
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  // Filtrer par jour sélectionné
  const filtered = selectedDay
    ? cours.filter((c: any) => c.dateNormalized === selectedDay)
    : cours;

  console.log("🔍 Affichage:", selectedDay || "TOUS", "| Cours filtrés:", filtered.length);

  // 🔥 Vérifier si réservé en utilisant le Set
  const isReserved = (cours: any): boolean => {
    if (!user?.id_membre || !cours.reservationKey) return false;
    const confirmedSet = (window as any).__confirmedReservations as Set<string> | undefined;
    return confirmedSet?.has(cours.reservationKey) || false;
  };

  // 🔥 Trouver l'ID de réservation pour annuler
  const getReservationId = (cours: any): number | null => {
    if (!user?.id_membre) return null;
    
    const reservation = reservations.find(
      (r: any) => 
        r.id_cours === cours.id_cours && 
        r.id_membre === user.id_membre && 
        r.statut === "confirmee"
    );
    
    return reservation?.id_reservation || null;
  };

  // 🔥 Vérifier si annulation possible (48h avant)
  const canCancel = (dateCours: string, heureDebut: string): { allowed: boolean; hoursLeft: number } => {
    try {
      const dateNorm = normalizeDate(dateCours);
      const timeNorm = normalizeTime(heureDebut);
      
      if (!dateNorm || !timeNorm) return { allowed: false, hoursLeft: 0 };
      
      // Créer la date en local (pas en UTC)
      const [year, month, day] = dateNorm.split('-').map(Number);
      const [hour, minute] = timeNorm.split(':').map(Number);
      const coursDateTime = new Date(year, month - 1, day, hour, minute);
      
      const now = new Date();
      const diffMs = coursDateTime.getTime() - now.getTime();
      const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
      
      return { allowed: hoursLeft >= 48, hoursLeft };
    } catch (e) {
      console.error("❌ Erreur canCancel:", e);
      return { allowed: false, hoursLeft: 0 };
    }
  };

  const handleReserver = async (cours: any) => {
    if (!user?.id_membre) {
      Alert.alert("Erreur", "Vous devez être connecté");
      return;
    }
    
    // Vérifier d'abord si déjà réservé
    if (isReserved(cours)) {
      Alert.alert("Déjà réservé", "Vous avez déjà une place pour ce cours");
      return;
    }
    
    console.log("📤 Envoi réservation:", {
      id_membre: user.id_membre,
      id_cours: cours.id_cours,
      id_util: user.id
    });
    
    try {
      await api.post("/reservations", { 
        id_membre: user.id_membre,
        id_cours: cours.id_cours,
        id_util: user.id
      });
      
      Alert.alert("Réservé ✓", "Votre place est confirmée !");
      await load(); // Recharger pour mettre à jour l'UI
    } catch (e: any) {
      console.error("❌ Erreur réservation:", e);
      
      // Gérer l'erreur "Déjà inscrit"
      if (e.message?.includes("Déjà inscrit")) {
        Alert.alert("Déjà réservé", "Vous avez déjà une place pour ce cours");
        await load();
      } else {
        Alert.alert("Erreur", e.message || "Impossible de réserver");
      }
    }
  };

  const handleAnnuler = async (cours: any) => {
  console.log("🔴 [START] handleAnnuler pour cours:", cours.id_cours);
  
  const reservationId = getReservationId(cours);
  
  if (!reservationId) {
    console.log("❌ Aucune réservation trouvée");
    if (Platform.OS === "web") {
      alert("Aucune réservation trouvée pour ce cours");
    } else {
      Alert.alert("Erreur", "Aucune réservation trouvée pour ce cours");
    }
    return;
  }

  console.log("✅ Réservation trouvée ID:", reservationId);
  
  const { allowed, hoursLeft } = canCancel(cours.date_cours, cours.heure_debut);
  
  console.log("⏰ canCancel résultat:", { allowed, hoursLeft, date: cours.date_cours, heure: cours.heure_debut });
  
  if (!allowed) {
    console.log("🚫 Annulation bloquée (< 48h)");
    const message = `L'annulation doit se faire au moins 48h avant le cours.\nIl reste ${hoursLeft}h avant le début.`;
    
    if (Platform.OS === "web") {
      alert(message);
    } else {
      Alert.alert("Annulation impossible", message, [{ text: "OK" }]);
    }
    return;
  }

  console.log("✅ Annulation autorisée, affichage confirmation...");
  
  // 🔥 Utiliser window.confirm sur Web pour éviter les bugs d'Alert.alert()
  const confirmed = Platform.OS === "web" 
    ? window.confirm("Êtes-vous sûr de vouloir annuler cette réservation ?")
    : await new Promise<boolean>(resolve => {
        Alert.alert(
          "Annuler la réservation",
          "Êtes-vous sûr de vouloir annuler ?",
          [
            { text: "Non", style: "cancel", onPress: () => resolve(false) },
            { text: "Oui, annuler", style: "destructive", onPress: () => resolve(true) },
          ]
        );
      });
  
  if (!confirmed) {
    console.log("❌ Utilisateur a annulé l'opération");
    return;
  }
  
  console.log("✅ Confirmation reçue, début annulation API...");
  
  try {
    console.log("📡 Appel API PUT /reservations/" + reservationId + "/annuler");
    await api.put(`/reservations/${reservationId}/annuler`);
    console.log("✅ API annulation réussie");
    
    // Mettre à jour le Set immédiatement
    const confirmedSet = (window as any).__confirmedReservations as Set<string> | undefined;
    if (confirmedSet && cours.reservationKey) {
      confirmedSet.delete(cours.reservationKey);
      console.log("✅ ReservationKey supprimée du Set");
    }
    
    // Mettre à jour le state
    setReservations(prev => prev.filter((r: any) => r.id_reservation !== reservationId));
    console.log("✅ State reservations mis à jour");
    
    await load();
    console.log("✅ load() terminé");
    
    if (Platform.OS === "web") {
      alert("Réservation annulée avec succès ✓");
    } else {
      Alert.alert("Succès ✓", "Réservation annulée");
    }
    console.log("✅ Annulation terminée avec succès");
    
  } catch (e: any) {
    console.error("❌ Erreur annulation:", e);
    const errorMsg = e.message || "Impossible d'annuler";
    if (Platform.OS === "web") {
      alert("Erreur: " + errorMsg);
    } else {
      Alert.alert("Erreur", errorMsg);
    }
  }
};
// Compter les cours par jour pour le résumé
const coursParJour = days.reduce<Record<string, number>>((acc, d) => {
  acc[d] = cours.filter((c: any) => c.dateNormalized === d).length;
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
      <Text style={[styles.title, { color: colors.foreground }]}>
        Planning{selectedDay ? ` · ${selectedDay}` : ""}
      </Text>

      {/* Résumé hebdomadaire */}
      {cours.length > 0 && !selectedDay && (
        <View style={[styles.weekSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekRow}>
            {days.map((d) => {
              const dateObj = new Date(d + "T12:00:00");
              const count = coursParJour[d] || 0;
              const isSelected = selectedDay === d;
              return (
                <TouchableOpacity
                  key={d}
                  onPress={() => setSelectedDay(isSelected ? null : d)}
                  style={[styles.weekDay, isSelected && { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.weekDayLabel}>{DAYS_FR[dateObj.getDay()]}</Text>
                  <Text style={styles.weekDayNum}>{dateObj.getDate()}</Text>
                  {count > 0 && <View style={styles.weekDayBadge}><Text style={styles.weekDayBadgeText}>{count}</Text></View>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Filtres rapides */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        <TouchableOpacity onPress={() => setSelectedDay(null)} style={[styles.filterBtn, !selectedDay && { backgroundColor: colors.primary }]}>
          <Text style={[styles.filterText, { color: !selectedDay ? "#fff" : colors.mutedForeground }]}>Tous</Text>
        </TouchableOpacity>
        {days.map((d) => {
          const dateObj = new Date(d + "T12:00:00");
          const isSelected = selectedDay === d;
          const count = coursParJour[d] || 0;
          if (count === 0) return null;
          return (
            <TouchableOpacity key={d} onPress={() => setSelectedDay(isSelected ? null : d)} style={[styles.filterBtn, isSelected && { backgroundColor: colors.primary }]}>
              <Text style={styles.filterDayLabel}>{DAYS_FR[dateObj.getDay()]}</Text>
              <Text style={styles.filterDayNum}>{dateObj.getDate()}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* LISTE DES COURS */}
      {filtered.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="calendar" size={32} color={colors.mutedForeground} />
          <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>
            Aucun cours {selectedDay ? `le ${selectedDay}` : "cette semaine"}
          </Text>
        </View>
      ) : (
        filtered.map((c: any, index: number) => {
          const reserved = isReserved(c);
          const { allowed, hoursLeft } = canCancel(c.date_cours, c.heure_debut);
          
          // Créer une clé unique pour React
          const reactKey = `${c.id_cours}-${c.dateNormalized}-${c.timeNormalized}-${c.salle || ''}-${index}`;
          
          console.log(`🎨 Rendu [${index}]:`, {
            id: c.id_cours,
            key: reactKey,
            reserved,
            canCancel: allowed,
            hoursLeft
          });
          
          return (
            <CoursCard
              key={reactKey}
              cours={c}
              reserved={reserved}
              canCancel={allowed}
              hoursLeft={hoursLeft}
              waitlistCount={c.waitlist_count || 0}
              showActions={user?.role === "membre"}
              onReserver={() => handleReserver(c)}
              onAnnuler={() => handleAnnuler(c)}
            />
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 14 },
  title: { fontSize: 22, fontWeight: "800" },
  weekSummary: { borderRadius: 14, padding: 14, gap: 10 },
  weekRow: { gap: 8 },
  weekDay: { 
    width: 48, 
    alignItems: "center", 
    padding: 8, 
    borderRadius: 10, 
    gap: 4, 
    backgroundColor: "#f3f4f6" 
  },
  weekDayLabel: { fontSize: 10, fontWeight: "600" },
  weekDayNum: { fontSize: 16, fontWeight: "800" },
  weekDayBadge: { 
    borderRadius: 10, 
    paddingHorizontal: 5, 
    paddingVertical: 1, 
    minWidth: 18, 
    alignItems: "center", 
    backgroundColor: "rgba(59, 130, 246, 0.2)" 
  },
  weekDayBadgeText: { fontSize: 10, fontWeight: "800", color: "#3b82f6" },
  filters: { gap: 8, paddingVertical: 2 },
  filterBtn: { 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 10, 
    alignItems: "center", 
    backgroundColor: "#f3f4f6", 
    minWidth: 52 
  },
  filterText: { fontSize: 13, fontWeight: "700" },
  filterDayLabel: { fontSize: 11, fontWeight: "600" },
  filterDayNum: { fontSize: 15, fontWeight: "800" },
  empty: { 
    borderRadius: 12, 
    padding: 30, 
    alignItems: "center", 
    gap: 10, 
    borderWidth: 1 
  },
});