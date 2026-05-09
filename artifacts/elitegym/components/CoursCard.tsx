import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface Props {
  cours: any;
  onReserver?: () => void;
  onAnnuler?: () => void;
  reserved?: boolean;
  showActions?: boolean;
  // 👇 NOUVELLES PROPS pour la logique métier
  canCancel?: boolean;      // Vrai si > 48h avant le cours
  hoursLeft?: number;       // Nombre d'heures restantes avant le cours
  waitlistCount?: number;   // Nombre de personnes en liste d'attente
}

export default function CoursCard({ 
  cours, 
  onReserver, 
  onAnnuler, 
  reserved, 
  showActions = true,
  canCancel = true,
  hoursLeft = 0,
  waitlistCount = 0
}: Props) {
  const colors = useColors();

  // 🔧 Fix: gérer null/undefined/string/"0"/0 pour les places
  const placesRestantes = cours.places_restantes == null
    ? Number(cours.capacite_max)
    : Number(cours.places_restantes);
  
  const capaciteMax = Number(cours.capacite_max) || 20; // Valeur par défaut 20
  const complet = capaciteMax > 0 && placesRestantes <= 0;

  // Formatage de la date pour affichage
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* En-tête : Badge type + Statut */}
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>{cours.type_cours}</Text>
        </View>
        
        {/* Badge "Complet" rouge */}
        {complet && !reserved && (
          <View style={[styles.badge, { backgroundColor: "#ef444420" }]}>
            <Text style={[styles.badgeText, { color: "#ef4444" }]}>Complet</Text>
          </View>
        )}
        
        {/* Badge "Réservé" vert */}
        {reserved && (
          <View style={[styles.badge, { backgroundColor: "#10b98120" }]}>
            <Text style={[styles.badgeText, { color: "#10b981" }]}>Réservé ✓</Text>
          </View>
        )}
      </View>

      {/* Titre et Date */}
      <Text style={[styles.titre, { color: colors.foreground }]}>{cours.type_cours}</Text>
      <View style={styles.row}>
        <Feather name="calendar" size={13} color={colors.mutedForeground} />
        <Text style={[styles.info, { color: colors.mutedForeground }]}>
          {formatDate(cours.date_cours)} • {cours.heure_debut?.slice(0, 5)} • {cours.duree_minutes} min
        </Text>
      </View>

      {/* Salle */}
      <View style={styles.row}>
        <Feather name="map-pin" size={13} color={colors.mutedForeground} />
        <Text style={[styles.info, { color: colors.mutedForeground }]}>{cours.salle}</Text>
      </View>

      {/* Coach */}
      <View style={styles.row}>
        <Feather name="user" size={13} color={colors.mutedForeground} />
        <Text style={[styles.info, { color: colors.mutedForeground }]}>
          Coach {cours.prenom} {cours.nom}
        </Text>
      </View>

      {/* Places restantes + Liste d'attente */}
      <View style={styles.row}>
        <Feather name="users" size={13} color={colors.mutedForeground} />
        <Text style={[styles.info, { color: colors.mutedForeground }]}>
          {placesRestantes}/{capaciteMax} places
          {waitlistCount > 0 && (
            <Text style={{ color: "#f59e0b", fontWeight: "600" }}>
              {" "}· +{waitlistCount} en attente
            </Text>
          )}
        </Text>
      </View>

      {/* 🔥 BOUTONS D'ACTION */}
      {showActions && (
        <View style={styles.actions}>
          {reserved ? (
            // 👇 CAS : L'utilisateur a déjà réservé
            <TouchableOpacity
              onPress={() => {
                if (!canCancel) {
                  Alert.alert(
                    "Annulation impossible",
                    `L'annulation doit se faire au moins 48h avant le cours.\nIl reste ${hoursLeft}h.`,
                    [{ text: "OK" }]
                  );
                } else if (onAnnuler) {
                  onAnnuler();
                }
              }}
              disabled={!canCancel}
              style={[
                styles.btn, 
                { 
                  backgroundColor: !canCancel ? colors.background : "#ef444415", 
                  borderColor: !canCancel ? colors.border : "#ef4444",
                  borderWidth: 1 
                }
              ]}
            >
              <Text style={{ 
                color: !canCancel ? colors.mutedForeground : "#ef4444", 
                fontWeight: "600", 
                fontSize: 13 
              }}>
                {!canCancel ? `Annulation impossible (${hoursLeft}h)` : "Annuler ma place"}
              </Text>
            </TouchableOpacity>
          ) : (
            // 👇 CAS : L'utilisateur n'a pas réservé
            <TouchableOpacity
              onPress={onReserver}
              disabled={complet}
              style={[
                styles.btn, 
                { 
                  backgroundColor: complet ? colors.background : colors.primary,
                  borderColor: complet ? colors.border : colors.primary,
                  borderWidth: 1
                }
              ]}
            >
              <Text style={{ 
                color: complet ? colors.mutedForeground : "#fff", 
                fontWeight: "600", 
                fontSize: 13 
              }}>
                {complet ? "Liste d'attente" : "Réserver ma place"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    marginBottom: 10,
  },
  header: { flexDirection: "row", gap: 8, marginBottom: 2, alignItems: "center" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  titre: { fontSize: 16, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  info: { fontSize: 13 },
  actions: { marginTop: 8 },
  btn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
});