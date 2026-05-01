import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";

const PRODUITS = [
  { id: 1, nom: "Gants de Musculation", prix: 1500, cat: "Équipement" },
  { id: 2, nom: "Ceinture de Force", prix: 2800, cat: "Équipement" },
  { id: 3, nom: "Shaker Protéines 700ml", prix: 800, cat: "Nutrition" },
  { id: 4, nom: "Whey Protéine 1kg", prix: 4500, cat: "Nutrition" },
  { id: 5, nom: "T-Shirt EliteGym", prix: 1200, cat: "Vêtements" },
  { id: 6, nom: "Serviette de Sport", prix: 700, cat: "Accessoires" },
];

export default function BoutiqueScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const categories = [...new Set(PRODUITS.map((p) => p.cat))];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: Platform.OS === "web" ? 90 : insets.top + 16, paddingBottom: 100 },
      ]}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Boutique</Text>

      <View style={[styles.info, { backgroundColor: colors.secondary + "15", borderColor: colors.secondary + "40" }]}>
        <Feather name="info" size={14} color={colors.secondary} />
        <Text style={[styles.infoText, { color: colors.secondary }]}>
          Commandez en salle ou contactez-nous directement
        </Text>
      </View>

      {categories.map((cat) => (
        <View key={cat}>
          <Text style={[styles.section, { color: colors.foreground }]}>{cat}</Text>
          {PRODUITS.filter((p) => p.cat === cat).map((p) => (
            <View key={p.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.icon, { backgroundColor: colors.primary + "15" }]}>
                <Feather name="shopping-bag" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.nom, { color: colors.foreground }]}>{p.nom}</Text>
                <Text style={[styles.cat, { color: colors.mutedForeground }]}>{p.cat}</Text>
              </View>
              <Text style={[styles.prix, { color: colors.primary }]}>{p.prix.toLocaleString()} DA</Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: "800" },
  info: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
  },
  infoText: { fontSize: 13, flex: 1 },
  section: { fontSize: 16, fontWeight: "700", marginTop: 4, marginBottom: 6 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  icon: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  nom: { fontSize: 15, fontWeight: "600" },
  cat: { fontSize: 12 },
  prix: { fontSize: 16, fontWeight: "800" },
});
