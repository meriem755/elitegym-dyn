import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import EliteInput from "@/components/EliteInput";
import EliteButton from "@/components/EliteButton";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();
  const [telephone, setTelephone] = useState("");
  const [mdp, setMdp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!telephone || !mdp) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }
    setLoading(true);
    try {
      const data = await api.post("/auth/login", { telephone, mot_de_passe: mdp });

      if (data.role === "membre") {
        const membres = await api.get("/admin/membres");
        const membre = membres.find((m: any) => m.telephone === telephone);
        if (membre) data.id_membre = membre.id_membre;
      } else if (data.role === "coach") {
        const coachs = await api.get("/coachs");
        const coach = coachs.find((c: any) => c.telephone === telephone);
        if (coach) data.id_coach = coach.id_coach;
      }

      await login(data);

      if (data.role === "administrateur" || data.role === "gerant") {
        router.replace("/admin");
      } else if (data.role === "coach") {
        router.replace("/coach");
      } else {
        router.replace("/(tabs)");
      }
    } catch (e: any) {
      Alert.alert("Erreur", e.message || "Identifiants incorrects");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: Platform.OS === "web" ? 80 : insets.top + 40, paddingBottom: 40 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.logoSection}>
        <View style={[styles.logo, { backgroundColor: colors.primary }]}>
          <Text style={styles.logoText}>EG</Text>
        </View>
        <Text style={[styles.appName, { color: colors.foreground }]}>EliteGym</Text>
        <Text style={[styles.tagline, { color: colors.mutedForeground }]}>Performance & Excellence</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Connexion</Text>

        <EliteInput
          label="Numéro de téléphone"
          placeholder="+213..."
          value={telephone}
          onChangeText={setTelephone}
          keyboardType="phone-pad"
          autoCapitalize="none"
        />
        <EliteInput
          label="Mot de passe"
          placeholder="••••••••"
          value={mdp}
          onChangeText={setMdp}
          secureTextEntry
        />

        <EliteButton title="Se connecter" onPress={handleLogin} loading={loading} />

        <View style={[styles.note, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}>
          <Text style={[styles.noteText, { color: colors.primary }]}>
            ℹ️ L'inscription se fait exclusivement en présentiel à la salle.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, gap: 32 },
  logoSection: { alignItems: "center", gap: 8 },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: "#fff", fontSize: 26, fontWeight: "900" },
  appName: { fontSize: 28, fontWeight: "900" },
  tagline: { fontSize: 14 },
  card: {
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
  },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 4 },
  note: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  noteText: { fontSize: 13, lineHeight: 18 },
});
