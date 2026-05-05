import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Platform, Alert, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import EliteButton from "@/components/EliteButton";
import EliteInput from "@/components/EliteInput";
import { Feather } from "@expo/vector-icons";

type Section = "profil" | "securite";

export default function ProfilScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser } = useAuth();
  const [section, setSection] = useState<Section>("profil");
  const [loading, setLoading] = useState(false);

  const [ancienMdp, setAncienMdp] = useState("");
  const [nouveauMdp, setNouveauMdp] = useState("");
  const [nouveauTel, setNouveauTel] = useState("");
  const [nouvelEmail, setNouvelEmail] = useState("");

  const handleChangeMdp = async () => {
    if (!ancienMdp || !nouveauMdp) { Alert.alert("Erreur", "Remplissez les deux champs"); return; }
    if (nouveauMdp.length < 6) { Alert.alert("Erreur", "Mot de passe trop court (min 6 caractères)"); return; }
    setLoading(true);
    try {
      await api.post("/auth/change-password", { id_util: user?.id, ancien_mdp: ancienMdp, nouveau_mdp: nouveauMdp });
      Alert.alert("Succès", "Mot de passe modifié ✓");
      setAncienMdp(""); setNouveauMdp("");
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoading(false); }
  };

  const handleChangeTel = async () => {
    if (!nouveauTel) return;
    setLoading(true);
    try {
      await api.post("/auth/change-phone", { id_util: user?.id, telephone: nouveauTel });
      await updateUser?.({ telephone: nouveauTel });
      Alert.alert("Succès", "Numéro modifié ✓"); setNouveauTel("");
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoading(false); }
  };

  const handleChangeEmail = async () => {
    if (!nouvelEmail) return;
    setLoading(true);
    try {
      await api.post("/auth/change-email", { id_util: user?.id, email: nouvelEmail });
      await updateUser?.({ email: nouvelEmail });
      Alert.alert("Succès", "Email modifié ✓"); setNouvelEmail("");
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoading(false); }
  };

  const SECTIONS: { key: Section; label: string; icon: string }[] = [
    { key: "profil",   label: "Mon profil",  icon: "user" },
    { key: "securite", label: "Paramètres",  icon: "settings" },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[pr.container, { paddingTop: Platform.OS === "web" ? 80 : insets.top + 16, paddingBottom: 100 }]}
    >
      {/* Header */}
      <View style={[pr.headerCard, { backgroundColor: colors.primary }]}>
        <View style={pr.avatar}>
          <Text style={pr.avatarText}>{user?.prenom?.[0]}{user?.nom?.[0]}</Text>
        </View>
        <Text style={pr.name}>{user?.prenom} {user?.nom}</Text>
        <Text style={pr.role}>{user?.role === "membre" ? "Membre" : user?.role === "coach" ? "Coach" : "Administrateur"}</Text>
        {(user?.email || user?.telephone) && (
          <Text style={pr.contact}>{user.email || user.telephone}</Text>
        )}
        {/* Liens rapides pour membre */}
        {user?.role === "membre" && (
          <View style={pr.quickLinks}>
            {[
              { icon: "credit-card", label: "Paiements" },
              { icon: "bar-chart-2", label: "Présences" },
              { icon: "trending-up", label: "Progrès" },
            ].map((l) => (
              <View key={l.label} style={pr.quickLink}>
                <Feather name={l.icon as any} size={14} color="rgba(255,255,255,0.9)" />
                <Text style={pr.quickLinkText}>{l.label} ↓</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {user?.role === "membre" && (
        <View style={[pr.infoBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
          <Feather name="info" size={14} color={colors.primary} />
          <Text style={[pr.infoText, { color: colors.primary }]}>
            Retrouvez vos <Text style={{ fontWeight: "900" }}>Paiements</Text>, <Text style={{ fontWeight: "900" }}>Présences</Text> et <Text style={{ fontWeight: "900" }}>Progrès</Text> dans la barre de navigation en bas.
          </Text>
        </View>
      )}

      {/* Tabs */}
      <View style={[pr.tabRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {SECTIONS.map((s) => (
          <TouchableOpacity key={s.key} onPress={() => setSection(s.key)}
            style={[pr.tabBtn, section === s.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}>
            <Feather name={s.icon as any} size={14} color={section === s.key ? colors.primary : colors.mutedForeground} />
            <Text style={[pr.tabLabel, { color: section === s.key ? colors.primary : colors.mutedForeground }]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* PROFIL */}
      {section === "profil" && (
        <>
          {[
            { icon: "user",   label: "Nom complet",  value: `${user?.prenom} ${user?.nom}` },
            { icon: "shield", label: "Rôle",          value: user?.role },
            { icon: "mail",   label: "Email",          value: user?.email || "—" },
            { icon: "phone",  label: "Téléphone",      value: user?.telephone || "—" },
            ...(user?.id_membre ? [{ icon: "hash",  label: "N° Membre", value: `#${user.id_membre}` }] : []),
            ...(user?.id_coach  ? [{ icon: "award", label: "N° Coach",  value: `#${user.id_coach}` }]  : []),
          ].map((item) => (
            <View key={item.label} style={[pr.infoRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name={item.icon as any} size={16} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[pr.infoLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
                <Text style={[pr.infoValue, { color: colors.foreground }]}>{item.value}</Text>
              </View>
            </View>
          ))}
          <EliteButton title="Se déconnecter" onPress={logout} variant="danger" />
        </>
      )}

      {/* PARAMÈTRES */}
      {section === "securite" && (
        <>
          <View style={[pr.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[pr.cardTitle, { color: colors.foreground }]}>Changer le mot de passe</Text>
            <EliteInput label="Ancien mot de passe" secureTextEntry value={ancienMdp} onChangeText={setAncienMdp} placeholder="••••••••" />
            <EliteInput label="Nouveau mot de passe" secureTextEntry value={nouveauMdp} onChangeText={setNouveauMdp} placeholder="Min. 6 caractères" />
            <EliteButton title="Mettre à jour" onPress={handleChangeMdp} loading={loading} variant="secondary" small />
          </View>
          <View style={[pr.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[pr.cardTitle, { color: colors.foreground }]}>Changer le numéro</Text>
            <Text style={[pr.sub, { color: colors.mutedForeground }]}>Actuel : {user?.telephone || "—"}</Text>
            <EliteInput label="Nouveau numéro" value={nouveauTel} onChangeText={setNouveauTel} placeholder="+213..." keyboardType="phone-pad" />
            <EliteButton title="Mettre à jour" onPress={handleChangeTel} loading={loading} variant="secondary" small />
          </View>
          <View style={[pr.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[pr.cardTitle, { color: colors.foreground }]}>Changer l'email</Text>
            <Text style={[pr.sub, { color: colors.mutedForeground }]}>Actuel : {user?.email || "—"}</Text>
            <EliteInput label="Nouvel email" value={nouvelEmail} onChangeText={setNouvelEmail} placeholder="email@..." keyboardType="email-address" autoCapitalize="none" />
            <EliteButton title="Mettre à jour" onPress={handleChangeEmail} loading={loading} variant="secondary" small />
          </View>
          <View style={[pr.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[pr.cardTitle, { color: colors.foreground }]}>Connexion</Text>
            <Text style={[pr.sub, { color: colors.mutedForeground }]}>
              Connectez-vous avec votre <Text style={{ fontWeight: "700", color: colors.foreground }}>email</Text> ou votre <Text style={{ fontWeight: "700", color: colors.foreground }}>numéro de téléphone</Text>.{"\n\n"}
              Mot de passe par défaut (nouveaux comptes) : <Text style={{ fontWeight: "900", color: colors.primary }}>elitegym2026</Text>
            </Text>
          </View>
          <EliteButton title="Se déconnecter" onPress={logout} variant="danger" />
        </>
      )}
    </ScrollView>
  );
}

const pr = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 12 },
  headerCard: { borderRadius: 16, padding: 24, alignItems: "center", gap: 6 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 22, fontWeight: "800" },
  name: { color: "#fff", fontSize: 20, fontWeight: "800" },
  role: { color: "rgba(255,255,255,0.8)", fontSize: 13, textTransform: "capitalize" },
  contact: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 },
  quickLinks: { flexDirection: "row", gap: 12, marginTop: 10, flexWrap: "wrap", justifyContent: "center" },
  quickLink: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  quickLinkText: { color: "rgba(255,255,255,0.9)", fontSize: 11, fontWeight: "700" },
  infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 10, padding: 12, borderWidth: 1 },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
  tabRow: { flexDirection: "row", borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12 },
  tabLabel: { fontSize: 13, fontWeight: "600" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, padding: 14, borderWidth: 1 },
  infoLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3 },
  infoValue: { fontSize: 14, fontWeight: "600", marginTop: 2 },
  card: { borderRadius: 12, padding: 16, gap: 10, borderWidth: 1 },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  sub: { fontSize: 13, lineHeight: 20 },
});
