import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform, Linking, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";

export default function ContactScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const contacts = [
    { icon: "phone", label: "Téléphone", value: "+213 23 45 67 89", action: () => Linking.openURL("tel:+213234567890") },
    { icon: "mail", label: "Email", value: "contact@elitegym.dz", action: () => Linking.openURL("mailto:contact@elitegym.dz") },
    { icon: "map-pin", label: "Adresse", value: "123 Rue de la Sport, Béjaïa", action: undefined },
    { icon: "clock", label: "Horaires", value: "Lun-Sam: 6h00 - 22h00\nDim: 8h00 - 18h00", action: undefined },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: Platform.OS === "web" ? 90 : insets.top + 16, paddingBottom: 100 },
      ]}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Contact</Text>

      <View style={[styles.hero, { backgroundColor: colors.primary }]}>
        <Text style={styles.heroTitle}>EliteGym</Text>
        <Text style={styles.heroSub}>Votre salle de sport premium à Béjaïa</Text>
      </View>

      {contacts.map((c) => (
        <TouchableOpacity
          key={c.label}
          onPress={c.action}
          activeOpacity={c.action ? 0.7 : 1}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.iconBox, { backgroundColor: colors.primary + "15" }]}>
            <Feather name={c.icon as any} size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>{c.label}</Text>
            <Text style={[styles.value, { color: colors.foreground }]}>{c.value}</Text>
          </View>
          {c.action && <Feather name="chevron-right" size={18} color={colors.mutedForeground} />}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: "800" },
  hero: { borderRadius: 14, padding: 20, gap: 4 },
  heroTitle: { color: "#fff", fontSize: 24, fontWeight: "900" },
  heroSub: { color: "rgba(255,255,255,0.85)", fontSize: 14 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  iconBox: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 12, marginBottom: 2 },
  value: { fontSize: 15, fontWeight: "600" },
});
