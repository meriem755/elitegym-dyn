import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface Props {
  cours: any;
  onReserver?: () => void;
  onAnnuler?: () => void;
  reserved?: boolean;
  showActions?: boolean;
}

export default function CoursCard({ cours, onReserver, onAnnuler, reserved, showActions = true }: Props) {
  const colors = useColors();
  const complet = cours.places_restantes === 0;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>{cours.type_cours}</Text>
        </View>
        {complet && (
          <View style={[styles.badge, { backgroundColor: "#ef444420" }]}>
            <Text style={[styles.badgeText, { color: "#ef4444" }]}>Complet</Text>
          </View>
        )}
      </View>
      <Text style={[styles.titre, { color: colors.foreground }]}>{cours.type_cours}</Text>
      <View style={styles.row}>
        <Feather name="clock" size={13} color={colors.mutedForeground} />
        <Text style={[styles.info, { color: colors.mutedForeground }]}>
          {cours.heure_debut?.slice(0, 5)} • {cours.duree_minutes} min
        </Text>
      </View>
      <View style={styles.row}>
        <Feather name="map-pin" size={13} color={colors.mutedForeground} />
        <Text style={[styles.info, { color: colors.mutedForeground }]}>{cours.salle}</Text>
      </View>
      <View style={styles.row}>
        <Feather name="user" size={13} color={colors.mutedForeground} />
        <Text style={[styles.info, { color: colors.mutedForeground }]}>
          Coach {cours.prenom} {cours.nom}
        </Text>
      </View>
      <View style={styles.row}>
        <Feather name="users" size={13} color={colors.mutedForeground} />
        <Text style={[styles.info, { color: colors.mutedForeground }]}>
          {cours.places_restantes}/{cours.capacite_max} places
        </Text>
      </View>
      {showActions && (
        <View style={styles.actions}>
          {reserved ? (
            <TouchableOpacity
              onPress={onAnnuler}
              style={[styles.btn, { backgroundColor: "#ef444415", borderColor: "#ef4444", borderWidth: 1 }]}
            >
              <Text style={{ color: "#ef4444", fontWeight: "600", fontSize: 13 }}>Annuler</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={onReserver}
              disabled={complet}
              style={[styles.btn, { backgroundColor: complet ? colors.muted : colors.primary }]}
            >
              <Text style={{ color: complet ? colors.mutedForeground : "#fff", fontWeight: "600", fontSize: 13 }}>
                {complet ? "Complet" : "Réserver"}
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
  header: { flexDirection: "row", gap: 8, marginBottom: 2 },
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
