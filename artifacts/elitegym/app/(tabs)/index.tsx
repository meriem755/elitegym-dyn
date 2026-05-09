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

  const load = async () => {
    try {
      const c = await api.get("/cours/week");
      
      // 🔥 Dédupliquer les cours (même logique que Planning)
      const makeUniqueKey = (cours: any) => {
        return `${normalizeDate(cours.date_cours)}|${normalizeTime(cours.heure_debut)}|${cours.salle || ''}|${cours.id_coach || ''}`;
      };
      
      const seenKeys = new Set<string>();
      const coursUniques = c.filter((cours: any) => {
        const key = makeUniqueKey(cours);
        if (seenKeys.has(key)) return false;
        seenKeys.add(key);
        return true;
      });
      
      // 🔥 Ajouter reservationKey pour vérification rapide
      const coursAvecKey = coursUniques.slice(0, 5).map((cours: any) => ({
        ...cours,
        reservationKey: user?.id_membre ? `${cours.id_cours}_${user.id_membre}` : null,
        dateNormalized: normalizeDate(cours.date_cours),
        timeNormalized: normalizeTime(cours.heure_debut)
      }));
      
      setCours(coursAvecKey);

      if (user?.id_membre) {
        const [r, a] = await Promise.all([
          api.get(`/reservations/membre/${user.id_membre}`),
          api.get(`/abonnements/membre/${user.id_membre}`),
        ]);
        
        // 🔥 Créer un Set des réservations confirmées
        const confirmedReservations = new Set(
          r
            .filter((res: any) => res.statut === "confirmee")
            .map((res: any) => `${res.id_cours}_${user!.id_membre}`)
        );
        
        (window as any).__confirmedReservationsAccueil = confirmedReservations;
        setReservations(r);
        
        const actif = a.find((ab: any) => ab.statut === "actif");
        setAbonnement(actif || null);
      }
    } catch (e) {
      console.error("🔴 [ACCUEIL] Erreur load:", e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  
  const onRefresh = async () => { 
    setRefreshing(true); 
    await load(); 
    setRefreshing(false); 
  };

  // 🔥 Vérifier si réservé en utilisant le Set
  const isReserved = (cours: any): boolean => {
    if (!user?.id_membre || !cours.reservationKey) return false;
    const confirmedSet = (window as any).__confirmedReservationsAccueil as Set<string> | undefined;
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
      
      const coursDateTime = new Date(`${dateNorm}T${timeNorm}`);
      const now = new Date();
      const diffMs = coursDateTime.getTime() - now.getTime();
      const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
      
      return { allowed: hoursLeft >= 48, hoursLeft };
    } catch (e) {
      return { allowed: false, hoursLeft: 0 };
    }
  };

  const handleReserver = async (cours: any) => {
    if (!user?.id_membre) {
      Alert.alert("Erreur", "Vous devez être connecté");
      return;
    }
    
    if (isReserved(cours)) {
      Alert.alert("Déjà réservé", "Vous avez déjà une place pour ce cours");
      return;
    }
    
    try {
      await api.post("/reservations", { 
        id_membre: user.id_membre,
        id_cours: cours.id_cours,
        id_util: user.id
      });
      
      Alert.alert("Réservé ✓", "Votre place est confirmée !");
      await load();
    } catch (e: any) { 
      console.error("❌ Erreur réservation:", e);
      
      if (e.message?.includes("Déjà inscrit")) {
        Alert.alert("Déjà réservé", "Vous avez déjà une place pour ce cours");
        await load();
      } else {
        Alert.alert("Erreur", e.message || "Impossible de réserver");
      }
    }
  };

  // 🔥 Nouvelle fonction d'annulation
  const handleAnnuler = async (cours: any) => {
  console.log("🔴 handleAnnuler appelé pour:", cours.id_cours);
  
  const reservationId = getReservationId(cours);
  
  if (!reservationId) {
    Alert.alert("Erreur", "Aucune réservation trouvée pour ce cours");
    return;
  }

  const { allowed, hoursLeft } = canCancel(cours.date_cours, cours.heure_debut);
  
  if (!allowed) {
    Alert.alert(
      "Annulation impossible",
      `L'annulation doit se faire au moins 48h avant le cours.\nIl reste ${hoursLeft}h avant le début.`,
      [{ text: "OK" }]
    );
    return;
  }

  Alert.alert(
    "Annuler la réservation",
    "Êtes-vous sûr de vouloir annuler ?",
    [
      { text: "Non", style: "cancel" },
      {
        text: "Oui, annuler",
        style: "destructive",
        onPress: async () => {
          try {
            console.log("🗑️ Annulation réservation ID:", reservationId);
            
            // 1. Appel API
            await api.put(`/reservations/${reservationId}/annuler`);
            
            // 🔥 2. Mettre à jour le Set IMMÉDIATEMENT (sans attendre load())
            const confirmedSet = (window as any).__confirmedReservations as Set<string> | undefined;
            if (confirmedSet && cours.reservationKey) {
              confirmedSet.delete(cours.reservationKey);
              console.log("✅ Réservation supprimée du Set:", cours.reservationKey);
            }
            
            // 🔥 3. Mettre à jour le state reservations pour forcer re-render
            setReservations(prev => 
              prev.filter((r: any) => r.id_reservation !== reservationId)
            );
            
            // 4. Recharger les données en background
            await load();
            
            Alert.alert("Succès ✓", "Réservation annulée");
            
          } catch (e: any) {
            console.error("❌ Erreur annulation:", e);
            Alert.alert("Erreur", e.message || "Impossible d'annuler");
          }
        },
      },
    ]
  );
};

  const joursRestants = abonnement ? daysUntil(abonnement.date_fin) : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingTop: 16, paddingBottom: 100 }]}
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
        cours.map((c: any, index: number) => {
          const reserved = isReserved(c);
          const { allowed, hoursLeft } = canCancel(c.date_cours, c.heure_debut);
          
          // 🔥 Clé unique pour React
          const reactKey = `${c.id_cours}-${c.dateNormalized}-${c.timeNormalized}-${index}`;
          
          return (
            <CoursCard
              key={reactKey}
              cours={c}
              reserved={reserved}
              canCancel={allowed}        // ← NOUVEAU
              hoursLeft={hoursLeft}      // ← NOUVEAU
              waitlistCount={c.waitlist_count || 0}
              showActions={user?.role === "membre"}
              onReserver={() => handleReserver(c)}
              onAnnuler={() => handleAnnuler(c)}  // ← NOUVEAU
            />
          );
        })
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