import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Platform, Modal, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import EliteButton from "@/components/EliteButton";
import EliteInput from "@/components/EliteInput";
import { Feather } from "@expo/vector-icons";

type Tab = "membres" | "coachs" | "planning" | "paiements" | "audit" | "parametres";

const STATUT_COLORS: Record<string, string> = {
  en_attente: "#f59e0b",
  publie: "#10b981",
  annule: "#ef4444",
  termine: "#6b7280",
};

export default function AdminDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("membres");
  const [membres, setMembres] = useState<any[]>([]);
  const [coachs, setCoachs] = useState<any[]>([]);
  const [coursEnAttente, setCoursEnAttente] = useState<any[]>([]);
  const [paiements, setPaiements] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [refreshing, setRefreshing] = useState(false);
  const [showMembre, setShowMembre] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nom: "", prenom: "", telephone: "", email: "", specialite: "" });

  // Paramètres
  const [ancienMdp, setAncienMdp] = useState("");
  const [nouveauMdp, setNouveauMdp] = useState("");
  const [nouveauTel, setNouveauTel] = useState("");
  const [nouvelEmail, setNouvelEmail] = useState("");
  const [loadingParam, setLoadingParam] = useState(false);

  const load = async () => {
    try {
      const [m, c, p, a, st, cours] = await Promise.all([
        api.get("/admin/membres"),
        api.get("/admin/coachs"),
        api.get("/admin/paiements"),
        api.get("/admin/audit"),
        api.get("/admin/stats").catch(() => ({})),
        api.get("/admin/cours-en-attente"),
      ]);
      setMembres(m);
      setCoachs(c);
      setPaiements(p);
      setAudit(a);
      setStats(st);
      setCoursEnAttente(cours);
    } catch {}
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleApprouver = async (id_cours: number) => {
    try {
      await api.put(`/admin/cours/${id_cours}/approuver`);
      Alert.alert("Approuvé ✓", "Le cours est maintenant publié");
      load();
    } catch (e: any) { Alert.alert("Erreur", e.message); }
  };

  const handleRejeter = async (id_cours: number) => {
    Alert.alert("Confirmer", "Rejeter ce cours ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Rejeter", style: "destructive",
        onPress: async () => {
          try {
            await api.put(`/admin/cours/${id_cours}/rejeter`);
            Alert.alert("Rejeté", "Le cours a été annulé");
            load();
          } catch (e: any) { Alert.alert("Erreur", e.message); }
        },
      },
    ]);
  };

  const handleAjouterMembre = async () => {
    if (!form.nom || !form.prenom || (!form.telephone && !form.email)) {
      Alert.alert("Erreur", "Remplissez nom, prénom et au moins un contact (téléphone ou email)"); return;
    }
    setLoading(true);
    try {
      await api.post("/admin/membres", form);
      Alert.alert("Succès", `Membre ajouté\nMot de passe par défaut : elitegym2026`);
      setShowMembre(false);
      setForm({ nom: "", prenom: "", telephone: "", email: "", specialite: "" });
      load();
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoading(false); }
  };

  const handleAjouterCoach = async () => {
    if (!form.nom || !form.prenom || (!form.telephone && !form.email) || !form.specialite) {
      Alert.alert("Erreur", "Remplissez tous les champs (téléphone ou email requis)"); return;
    }
    setLoading(true);
    try {
      await api.post("/admin/coachs", form);
      Alert.alert("Succès", `Coach ajouté\nMot de passe par défaut : elitegym2026`);
      setShowCoach(false);
      setForm({ nom: "", prenom: "", telephone: "", email: "", specialite: "" });
      load();
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoading(false); }
  };

  const handleChangeMdp = async () => {
    if (!ancienMdp || !nouveauMdp) { Alert.alert("Erreur", "Remplissez les deux champs"); return; }
    if (nouveauMdp.length < 6) { Alert.alert("Erreur", "Mot de passe trop court (min 6 caractères)"); return; }
    setLoadingParam(true);
    try {
      await api.post("/auth/change-password", { id_util: user?.id, ancien_mdp: ancienMdp, nouveau_mdp: nouveauMdp });
      Alert.alert("Succès", "Mot de passe modifié ✓");
      setAncienMdp(""); setNouveauMdp("");
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoadingParam(false); }
  };

  const handleChangeTel = async () => {
    if (!nouveauTel) return;
    setLoadingParam(true);
    try {
      await api.post("/auth/change-phone", { id_util: user?.id, telephone: nouveauTel });
      Alert.alert("Succès", "Numéro modifié ✓");
      setNouveauTel("");
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoadingParam(false); }
  };

  const handleChangeEmail = async () => {
    if (!nouvelEmail) return;
    setLoadingParam(true);
    try {
      await api.post("/auth/change-email", { id_util: user?.id, email: nouvelEmail });
      Alert.alert("Succès", "Email modifié ✓");
      setNouvelEmail("");
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoadingParam(false); }
  };

  const TABS: { key: Tab; label: string; icon: string; badge?: number }[] = [
    { key: "membres",    label: "Membres",    icon: "users" },
    { key: "coachs",     label: "Coachs",     icon: "activity" },
    { key: "planning",   label: "Planning",   icon: "check-square", badge: coursEnAttente.length },
    { key: "paiements",  label: "Paiements",  icon: "credit-card" },
    { key: "audit",      label: "Audit",      icon: "file-text" },
    { key: "parametres", label: "Paramètres", icon: "settings" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: Platform.OS === "web" ? 80 : insets.top }]}>
        <View>
          <Text style={styles.headerTitle}>Espace Admin</Text>
          <Text style={styles.headerSub}>{user?.prenom} {user?.nom}</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Feather name="log-out" size={22} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        {[
          { label: "Membres", value: membres.length, color: colors.primary },
          { label: "Coachs", value: coachs.length, color: "#10b981" },
          { label: "En attente", value: coursEnAttente.length, color: "#f59e0b" },
        ].map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[styles.tabBtn, tab === t.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          >
            <View style={{ position: "relative" }}>
              <Feather name={t.icon as any} size={14} color={tab === t.key ? colors.primary : colors.mutedForeground} />
              {t.badge && t.badge > 0 ? (
                <View style={styles.badgeDot}>
                  <Text style={styles.badgeText}>{t.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.tabLabel, { color: tab === t.key ? colors.primary : colors.mutedForeground }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 80 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {tab === "membres" && (
          <>
            <EliteButton title="+ Ajouter un membre" onPress={() => setShowMembre(true)} variant="primary" small />
            {membres.map((m: any) => (
              <View key={m.id_membre} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardRow}>
                  <View style={[styles.cardAvatar, { backgroundColor: colors.primary + "20" }]}>
                    <Text style={[styles.cardAvatarText, { color: colors.primary }]}>{m.prenom?.[0]}{m.nom?.[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.foreground }]}>{m.prenom} {m.nom}</Text>
                    <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>{m.telephone || m.email}</Text>
                    <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Membre #{m.id_membre} • Inscrit le {m.date_inscription?.slice(0, 10)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {tab === "coachs" && (
          <>
            <EliteButton title="+ Ajouter un coach" onPress={() => setShowCoach(true)} variant="primary" small />
            {coachs.map((c: any) => (
              <View key={c.id_coach} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardRow}>
                  <View style={[styles.cardAvatar, { backgroundColor: "#10b981" + "20" }]}>
                    <Text style={[styles.cardAvatarText, { color: "#10b981" }]}>{c.prenom?.[0]}{c.nom?.[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.foreground }]}>{c.prenom} {c.nom}</Text>
                    <Text style={[styles.cardSub, { color: colors.primary }]}>{c.specialite}</Text>
                    <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Coach #{c.id_coach} • {c.telephone}</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {tab === "planning" && (
          <>
            {coursEnAttente.length === 0 ? (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, alignItems: "center", paddingVertical: 30 }]}>
                <Feather name="check-circle" size={32} color="#10b981" />
                <Text style={[styles.cardSub, { color: colors.mutedForeground, marginTop: 8, textAlign: "center" }]}>
                  Aucun cours en attente d'approbation
                </Text>
              </View>
            ) : (
              coursEnAttente.map((c: any) => (
                <View key={c.id_cours} style={[styles.card, { backgroundColor: colors.card, borderColor: "#f59e0b40", borderWidth: 1.5 }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, { color: colors.foreground }]}>{c.type_cours}</Text>
                      <Text style={[styles.cardSub, { color: colors.primary, fontWeight: "600" }]}>
                        Coach : {c.prenom} {c.nom}
                      </Text>
                      <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                        📅 {c.date_cours?.slice(0, 10)} à {c.heure_debut?.slice(0, 5)} • {c.duree_minutes} min
                      </Text>
                      <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                        🏠 {c.salle} • {c.capacite_max} places
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: "#f59e0b20" }]}>
                      <Text style={[styles.statusText, { color: "#f59e0b" }]}>En attente</Text>
                    </View>
                  </View>
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      onPress={() => handleRejeter(c.id_cours)}
                      style={[styles.actionBtn, { backgroundColor: "#ef444420", borderColor: "#ef4444" }]}
                    >
                      <Feather name="x" size={14} color="#ef4444" />
                      <Text style={[styles.actionText, { color: "#ef4444" }]}>Rejeter</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleApprouver(c.id_cours)}
                      style={[styles.actionBtn, { backgroundColor: "#10b98120", borderColor: "#10b981", flex: 2 }]}
                    >
                      <Feather name="check" size={14} color="#10b981" />
                      <Text style={[styles.actionText, { color: "#10b981" }]}>Approuver & Publier</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {tab === "paiements" && paiements.map((p: any) => (
          <View key={p.id_paiement} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{p.prenom} {p.nom}</Text>
                <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>{p.motif}</Text>
              </View>
              <Text style={[styles.montant, { color: p.statut === "valide" ? "#10b981" : "#ef4444" }]}>
                {Number(p.montant).toLocaleString()} DA
              </Text>
            </View>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              {new Date(p.date_heure).toLocaleDateString("fr-FR")} • {p.mode_paiement} • {p.statut}
            </Text>
          </View>
        ))}

        {tab === "audit" && audit.map((a: any) => (
          <View key={a.id_journal} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{a.action}</Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              {a.prenom} {a.nom} • {new Date(a.date_action).toLocaleString("fr-FR")}
            </Text>
            {a.table_affectee && (
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Table: {a.table_affectee}</Text>
            )}
          </View>
        ))}

        {tab === "parametres" && (
          <>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Informations du compte</Text>
              {[
                { icon: "user",  label: "Nom complet", value: `${user?.prenom} ${user?.nom}` },
                { icon: "shield",label: "Rôle",         value: user?.role },
                { icon: "mail",  label: "Email",         value: user?.email || "—" },
                { icon: "phone", label: "Téléphone",     value: user?.telephone || "—" },
              ].map((item) => (
                <View key={item.label} style={[styles.infoRow, { borderColor: colors.border }]}>
                  <Feather name={item.icon as any} size={15} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>{item.label}</Text>
                    <Text style={[styles.cardTitle, { color: colors.foreground, fontSize: 14 }]}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, gap: 10 }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Changer le mot de passe</Text>
              <EliteInput label="Ancien mot de passe" secureTextEntry value={ancienMdp} onChangeText={setAncienMdp} placeholder="••••••••" />
              <EliteInput label="Nouveau mot de passe" secureTextEntry value={nouveauMdp} onChangeText={setNouveauMdp} placeholder="Min. 6 caractères" />
              <EliteButton title="Mettre à jour" onPress={handleChangeMdp} loading={loadingParam} variant="secondary" small />
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, gap: 10 }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Changer le numéro</Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Actuel : {user?.telephone || "—"}</Text>
              <EliteInput label="Nouveau numéro" value={nouveauTel} onChangeText={setNouveauTel} placeholder="+213..." keyboardType="phone-pad" />
              <EliteButton title="Mettre à jour" onPress={handleChangeTel} loading={loadingParam} variant="secondary" small />
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, gap: 10 }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Changer l'email</Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Actuel : {user?.email || "—"}</Text>
              <EliteInput label="Nouvel email" value={nouvelEmail} onChangeText={setNouvelEmail} placeholder="admin@elitegym.dz" keyboardType="email-address" autoCapitalize="none" />
              <EliteButton title="Mettre à jour" onPress={handleChangeEmail} loading={loadingParam} variant="secondary" small />
            </View>

            <EliteButton title="Se déconnecter" onPress={logout} variant="danger" />
          </>
        )}
      </ScrollView>

      <Modal visible={showMembre || showCoach} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {showMembre ? "Nouveau membre" : "Nouveau coach"}
            </Text>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <EliteInput label="Nom" value={form.nom} onChangeText={(v) => setForm({ ...form, nom: v })} />
              </View>
              <View style={{ flex: 1 }}>
                <EliteInput label="Prénom" value={form.prenom} onChangeText={(v) => setForm({ ...form, prenom: v })} />
              </View>
            </View>
            <EliteInput label="Téléphone (optionnel)" value={form.telephone} onChangeText={(v) => setForm({ ...form, telephone: v })} keyboardType="phone-pad" placeholder="+213..." />
            <EliteInput label="Email (optionnel)" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" autoCapitalize="none" placeholder="prenom.nom@elitegym.dz" />
            <View style={[styles.infoBox, { backgroundColor: "#f59e0b10", borderColor: "#f59e0b40" }]}>
              <Text style={[styles.infoBoxText, { color: "#b45309" }]}>
                ⚠️ Au moins un contact requis : téléphone ou email.
              </Text>
            </View>
            {showCoach && (
              <EliteInput label="Spécialité" value={form.specialite} onChangeText={(v) => setForm({ ...form, specialite: v })} placeholder="ex: Musculation & Force" />
            )}
            <View style={[styles.infoBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
              <Text style={[styles.infoBoxText, { color: colors.primary }]}>
                Mot de passe par défaut : <Text style={{ fontWeight: "900" }}>elitegym2026</Text>
              </Text>
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <EliteButton title="Annuler" onPress={() => { setShowMembre(false); setShowCoach(false); }} variant="outline" />
              </View>
              <View style={{ flex: 1 }}>
                <EliteButton title="Ajouter" onPress={showMembre ? handleAjouterMembre : handleAjouterCoach} loading={loading} />
              </View>
            </View>
          </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  statCard: { flex: 1, borderRadius: 10, padding: 12, alignItems: "center", borderWidth: 1 },
  statNum: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11 },
  tabBar: { borderBottomWidth: 1 },
  tabBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 12 },
  tabLabel: { fontSize: 12, fontWeight: "600" },
  badgeDot: { position: "absolute", top: -5, right: -8, backgroundColor: "#E63946", borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "900" },
  content: { padding: 16, gap: 10 },
  card: { borderRadius: 12, padding: 14, gap: 8, borderWidth: 1 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  cardAvatarText: { fontSize: 14, fontWeight: "800" },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardSub: { fontSize: 12, lineHeight: 18 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: "700" },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 8, paddingVertical: 8, borderWidth: 1 },
  actionText: { fontSize: 13, fontWeight: "700" },
  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  montant: { fontSize: 16, fontWeight: "800" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  infoBox: { borderRadius: 8, padding: 10, borderWidth: 1 },
  infoBoxText: { fontSize: 12 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, paddingVertical: 10 },
});
