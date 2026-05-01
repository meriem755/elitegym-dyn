import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import EliteButton from "@/components/EliteButton";
import EliteInput from "@/components/EliteInput";
import { Feather } from "@expo/vector-icons";

export default function ProfilScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [taille, setTaille] = useState("");
  const [poids, setPoids] = useState("");
  const [bmi, setBmi] = useState<number | null>(null);
  const [nouveauMdp, setNouveauMdp] = useState("");
  const [ancienMdp, setAncienMdp] = useState("");
  const [nouveauTel, setNouveauTel] = useState("");
  const [loading, setLoading] = useState(false);

  const calcBMI = () => {
    const h = parseFloat(taille) / 100;
    const p = parseFloat(poids);
    if (h > 0 && p > 0) {
      setBmi(p / (h * h));
    } else {
      Alert.alert("Erreur", "Entrez une taille et un poids valides");
    }
  };

  const getBMILabel = (bmi: number) => {
    if (bmi < 18.5) return { label: "Insuffisance pondérale", color: "#3b82f6" };
    if (bmi < 25) return { label: "Poids normal ✓", color: "#10b981" };
    if (bmi < 30) return { label: "Surpoids", color: "#f59e0b" };
    return { label: "Obésité", color: "#ef4444" };
  };

  const handleChangeMdp = async () => {
    if (!ancienMdp || !nouveauMdp) return;
    setLoading(true);
    try {
      await api.post("/auth/change-password", {
        id_util: user?.id,
        ancien_mdp: ancienMdp,
        nouveau_mdp: nouveauMdp,
      });
      Alert.alert("Succès", "Mot de passe modifié");
      setAncienMdp(""); setNouveauMdp("");
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoading(false); }
  };

  const handleChangeTel = async () => {
    if (!nouveauTel) return;
    setLoading(true);
    try {
      await api.post("/auth/change-phone", { id_util: user?.id, telephone: nouveauTel });
      Alert.alert("Succès", "Numéro modifié");
      setNouveauTel("");
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: Platform.OS === "web" ? 90 : insets.top + 16, paddingBottom: 100 },
      ]}
    >
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.prenom?.[0]}{user?.nom?.[0]}</Text>
        </View>
        <Text style={styles.name}>{user?.prenom} {user?.nom}</Text>
        <Text style={styles.role}>{user?.role}</Text>
      </View>

      <View style={[styles.section_, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Calculer mon IMC</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <EliteInput label="Taille (cm)" placeholder="175" value={taille} onChangeText={setTaille} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <EliteInput label="Poids (kg)" placeholder="70" value={poids} onChangeText={setPoids} keyboardType="numeric" />
          </View>
        </View>
        <EliteButton title="Calculer" onPress={calcBMI} variant="secondary" small />
        {bmi !== null && (
          <View style={[styles.bmiResult, { backgroundColor: getBMILabel(bmi).color + "15" }]}>
            <Text style={[styles.bmiValue, { color: getBMILabel(bmi).color }]}>{bmi.toFixed(1)}</Text>
            <Text style={[styles.bmiLabel, { color: getBMILabel(bmi).color }]}>{getBMILabel(bmi).label}</Text>
          </View>
        )}
      </View>

      <View style={[styles.section_, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Changer le mot de passe</Text>
        <EliteInput label="Ancien mot de passe" secureTextEntry value={ancienMdp} onChangeText={setAncienMdp} placeholder="••••••••" />
        <EliteInput label="Nouveau mot de passe" secureTextEntry value={nouveauMdp} onChangeText={setNouveauMdp} placeholder="••••••••" />
        <EliteButton title="Mettre à jour" onPress={handleChangeMdp} loading={loading} variant="secondary" small />
      </View>

      <View style={[styles.section_, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Changer le numéro</Text>
        <EliteInput label="Nouveau numéro" value={nouveauTel} onChangeText={setNouveauTel} placeholder="+213..." keyboardType="phone-pad" />
        <EliteButton title="Mettre à jour" onPress={handleChangeTel} loading={loading} variant="secondary" small />
      </View>

      <EliteButton title="Se déconnecter" onPress={logout} variant="danger" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 14 },
  header: { borderRadius: 16, padding: 24, alignItems: "center", gap: 6 },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 22, fontWeight: "800" },
  name: { color: "#fff", fontSize: 20, fontWeight: "800" },
  role: { color: "rgba(255,255,255,0.8)", fontSize: 13, textTransform: "capitalize" },
  section_: { borderRadius: 12, padding: 16, gap: 12, borderWidth: 1 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  row: { flexDirection: "row", gap: 10 },
  bmiResult: { borderRadius: 10, padding: 14, alignItems: "center", gap: 4 },
  bmiValue: { fontSize: 36, fontWeight: "900" },
  bmiLabel: { fontSize: 14, fontWeight: "600" },
});
