import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Platform, Alert, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import EliteButton from "@/components/EliteButton";
import EliteInput from "@/components/EliteInput";
import { Feather } from "@expo/vector-icons";

type Section = "profil" | "securite" | "progress";

function StatPill({ label, value, color }: { label: string; value: any; color: string }) {
  return (
    <View style={[sp.pill, { backgroundColor: color + "15" }]}>
      <Text style={[sp.value, { color }]}>{value}</Text>
      <Text style={[sp.label, { color }]}>{label}</Text>
    </View>
  );
}
const sp = StyleSheet.create({
  pill: { borderRadius: 10, padding: 10, alignItems: "center", flex: 1 },
  value: { fontSize: 18, fontWeight: "900" },
  label: { fontSize: 11, fontWeight: "600", opacity: 0.8 },
});

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

  const [suivis, setSuivis] = useState<any[]>([]);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);

  useEffect(() => {
    if (section === "progress" && user?.id_membre) loadProgress();
  }, [section]);

  const loadProgress = async () => {
    if (!user?.id_membre) return;
    setLoadingProgress(true);
    try {
      const [s, p] = await Promise.all([
        api.get(`/progress/membre/${user.id_membre}`),
        api.get(`/exercices/membre/${user.id_membre}`),
      ]);
      setSuivis(s);
      setProgrammes(p);
    } catch {}
    setLoadingProgress(false);
  };

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
      await updateUser({ telephone: nouveauTel });
      Alert.alert("Succès", "Numéro modifié ✓");
      setNouveauTel("");
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoading(false); }
  };

  const handleChangeEmail = async () => {
    if (!nouvelEmail) return;
    setLoading(true);
    try {
      await api.post("/auth/change-email", { id_util: user?.id, email: nouvelEmail });
      await updateUser({ email: nouvelEmail });
      Alert.alert("Succès", "Email modifié ✓");
      setNouvelEmail("");
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoading(false); }
  };

  const SECTIONS: { key: Section; label: string; icon: string }[] = [
    { key: "profil", label: "Profil", icon: "user" },
    { key: "securite", label: "Paramètres", icon: "settings" },
    ...(user?.role === "membre" ? [{ key: "progress" as Section, label: "Progrès", icon: "trending-up" }] : []),
  ];

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
        {(user?.email || user?.telephone) && (
          <Text style={styles.contact}>{user.email || user.telephone}</Text>
        )}
      </View>

      <View style={[styles.tabs, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {SECTIONS.map((s) => (
          <TouchableOpacity
            key={s.key}
            onPress={() => setSection(s.key)}
            style={[styles.tabBtn, section === s.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          >
            <Feather name={s.icon as any} size={14} color={section === s.key ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.tabLabel, { color: section === s.key ? colors.primary : colors.mutedForeground }]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {section === "profil" && (
        <>
          {[
            { icon: "user", label: "Nom complet", value: `${user?.prenom} ${user?.nom}` },
            { icon: "shield", label: "Rôle", value: user?.role },
            { icon: "mail", label: "Email", value: user?.email || "—" },
            { icon: "phone", label: "Téléphone", value: user?.telephone || "—" },
            ...(user?.id_membre ? [{ icon: "hash", label: "N° Membre", value: `#${user.id_membre}` }] : []),
            ...(user?.id_coach ? [{ icon: "award", label: "N° Coach", value: `#${user.id_coach}` }] : []),
          ].map((item) => (
            <View key={item.label} style={[styles.infoRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name={item.icon as any} size={16} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.value}</Text>
              </View>
            </View>
          ))}
          <EliteButton title="Se déconnecter" onPress={logout} variant="danger" />
        </>
      )}

      {section === "securite" && (
        <>
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Changer le mot de passe</Text>
            <EliteInput label="Ancien mot de passe" secureTextEntry value={ancienMdp} onChangeText={setAncienMdp} placeholder="••••••••" />
            <EliteInput label="Nouveau mot de passe" secureTextEntry value={nouveauMdp} onChangeText={setNouveauMdp} placeholder="Min. 6 caractères" />
            <EliteButton title="Mettre à jour" onPress={handleChangeMdp} loading={loading} variant="secondary" small />
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Changer le numéro</Text>
            <Text style={[styles.current, { color: colors.mutedForeground }]}>Actuel : {user?.telephone || "—"}</Text>
            <EliteInput label="Nouveau numéro" value={nouveauTel} onChangeText={setNouveauTel} placeholder="+213..." keyboardType="phone-pad" />
            <EliteButton title="Mettre à jour" onPress={handleChangeTel} loading={loading} variant="secondary" small />
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Changer l'email</Text>
            <Text style={[styles.current, { color: colors.mutedForeground }]}>Actuel : {user?.email || "—"}</Text>
            <EliteInput label="Nouvel email" value={nouvelEmail} onChangeText={setNouvelEmail} placeholder="email@..." keyboardType="email-address" autoCapitalize="none" />
            <EliteButton title="Mettre à jour" onPress={handleChangeEmail} loading={loading} variant="secondary" small />
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Informations de connexion</Text>
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              Vous pouvez vous connecter avec votre <Text style={{ fontWeight: "700", color: colors.foreground }}>email</Text> OU votre <Text style={{ fontWeight: "700", color: colors.foreground }}>numéro de téléphone</Text>.{"\n\n"}
              Mot de passe par défaut (nouveaux comptes) :{"\n"}
              <Text style={{ fontWeight: "900", color: colors.primary }}>elitegym2026</Text>
            </Text>
          </View>
        </>
      )}

      {section === "progress" && user?.role === "membre" && (
        <>
          {loadingProgress ? (
            <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 30 }}>Chargement...</Text>
          ) : (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Suivi des performances</Text>
              {suivis.length === 0 ? (
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.current, { color: colors.mutedForeground }]}>
                    Aucune mesure enregistrée. Parlez à votre coach pour commencer le suivi.
                  </Text>
                </View>
              ) : (
                suivis.map((s: any) => (
                  <View key={s.id_suivi} style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{s.date_mesure?.slice(0, 10)}</Text>
                      <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600" }}>{s.coach_nom}</Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      {s.poids_kg && <StatPill label="Poids" value={`${s.poids_kg} kg`} color={colors.primary} />}
                      {s.imc && <StatPill label="IMC" value={s.imc} color="#10b981" />}
                      {s.tour_taille && <StatPill label="Tour taille" value={`${s.tour_taille} cm`} color="#f59e0b" />}
                    </View>
                    {s.observations && (
                      <Text style={[styles.current, { color: colors.foreground }]}>📝 {s.observations}</Text>
                    )}
                  </View>
                ))
              )}

              <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 6 }]}>Programmes d'entraînement</Text>
              {programmes.length === 0 ? (
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.current, { color: colors.mutedForeground }]}>
                    Aucun programme assigné. Votre coach peut en créer un pour vous.
                  </Text>
                </View>
              ) : (
                programmes.map((p: any) => (
                  <View key={p.id_programme} style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{p.titre}</Text>
                    <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600" }}>Coach : {p.coach_nom}</Text>
                    {p.description && (
                      <Text style={[styles.current, { color: colors.foreground }]}>{p.description}</Text>
                    )}
                    <Text style={[styles.current, { color: colors.mutedForeground }]}>Créé le {p.date_creation?.slice(0, 10)}</Text>
                  </View>
                ))
              )}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 12 },
  header: { borderRadius: 16, padding: 24, alignItems: "center", gap: 4 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 22, fontWeight: "800" },
  name: { color: "#fff", fontSize: 20, fontWeight: "800" },
  role: { color: "rgba(255,255,255,0.8)", fontSize: 13, textTransform: "capitalize" },
  contact: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 },
  tabs: { flexDirection: "row", borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 12 },
  tabLabel: { fontSize: 12, fontWeight: "600" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, padding: 14, borderWidth: 1 },
  infoLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3 },
  infoValue: { fontSize: 14, fontWeight: "600", marginTop: 2 },
  section: { borderRadius: 12, padding: 16, gap: 10, borderWidth: 1 },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  current: { fontSize: 13, lineHeight: 20 },
  infoText: { fontSize: 13, lineHeight: 22 },
});
