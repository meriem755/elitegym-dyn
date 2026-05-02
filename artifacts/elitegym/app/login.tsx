import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, Platform, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
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
      // id_membre et id_coach sont maintenant retournés directement par le serveur
      const data = await api.post("/auth/login", { telephone, mot_de_passe: mdp });
      await login(data);

      if (data.role === "administrateur" || data.role === "gerant") {
        router.replace("/admin");
      } else if (data.role === "coach") {
        router.replace("/coach");
      } else {
        router.replace("/(tabs)");
      }
    } catch (e: any) {
      Alert.alert("Connexion impossible", e.message || "Identifiants incorrects");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: Platform.OS === "web" ? 60 : insets.top + 20, paddingBottom: 40 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.replace("/")}
        activeOpacity={0.7}
      >
        <Feather name="arrow-left" size={18} color={colors.mutedForeground} />
        <Text style={[styles.backText, { color: colors.mutedForeground }]}>Retour à l'accueil</Text>
      </TouchableOpacity>

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
          label="Téléphone ou Email"
          placeholder="+213... ou admin@elitegym.dz"
          value={telephone}
          onChangeText={setTelephone}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
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
            ℹ️ Mot de passe par défaut (nouveaux comptes) : elitegym2026{"\n"}
            L'inscription se fait en présentiel à la salle.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, gap: 24 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  backText: { fontSize: 14 },
  logoSection: { alignItems: "center", gap: 8 },
  logo: { width: 72, height: 72, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  logoText: { color: "#fff", fontSize: 26, fontWeight: "900" },
  appName: { fontSize: 28, fontWeight: "900" },
  tagline: { fontSize: 14 },
  card: { borderRadius: 16, padding: 20, gap: 16, borderWidth: 1 },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 4 },
  note: { borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 4 },
  noteText: { fontSize: 13, lineHeight: 18 },
});
