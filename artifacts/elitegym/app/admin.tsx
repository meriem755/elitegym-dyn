import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Platform, Modal, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import EliteButton from "@/components/EliteButton";
import EliteInput from "@/components/EliteInput";
import { Feather } from "@expo/vector-icons";

type Tab = "membres" | "coachs" | "paiements" | "audit";

export default function AdminDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("membres");
  const [membres, setMembres] = useState<any[]>([]);
  const [coachs, setCoachs] = useState<any[]>([]);
  const [paiements, setPaiements] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showMembre, setShowMembre] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nom: "", prenom: "", telephone: "", specialite: "" });

  const load = async () => {
    try {
      const [m, c, p, a] = await Promise.all([
        api.get("/admin/membres"),
        api.get("/admin/coachs"),
        api.get("/admin/paiements"),
        api.get("/admin/audit"),
      ]);
      setMembres(m);
      setCoachs(c);
      setPaiements(p);
      setAudit(a);
    } catch {}
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleAjouterMembre = async () => {
    if (!form.nom || !form.prenom || !form.telephone) { Alert.alert("Erreur", "Remplissez tous les champs"); return; }
    setLoading(true);
    try {
      await api.post("/admin/membres", form);
      Alert.alert("Succès", "Membre ajouté");
      setShowMembre(false);
      setForm({ nom: "", prenom: "", telephone: "", specialite: "" });
      load();
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoading(false); }
  };

  const handleAjouterCoach = async () => {
    if (!form.nom || !form.prenom || !form.telephone || !form.specialite) { Alert.alert("Erreur", "Remplissez tous les champs"); return; }
    setLoading(true);
    try {
      await api.post("/admin/coachs", form);
      Alert.alert("Succès", "Coach ajouté");
      setShowCoach(false);
      setForm({ nom: "", prenom: "", telephone: "", specialite: "" });
      load();
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoading(false); }
  };

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: "membres", label: "Membres", icon: "users" },
    { key: "coachs", label: "Coachs", icon: "activity" },
    { key: "paiements", label: "Paiements", icon: "credit-card" },
    { key: "audit", label: "Audit", icon: "file-text" },
  ];

  const counts = { membres: membres.length, coachs: coachs.length, paiements: paiements.length };

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
          { label: "Membres", value: counts.membres, color: colors.primary },
          { label: "Coachs", value: counts.coachs, color: "#10b981" },
          { label: "Paiements", value: counts.paiements, color: "#f59e0b" },
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
            <Feather name={t.icon as any} size={14} color={tab === t.key ? colors.primary : colors.mutedForeground} />
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
            <EliteButton title="Ajouter un membre" onPress={() => setShowMembre(true)} variant="primary" small />
            {membres.map((m: any) => (
              <View key={m.id_membre} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{m.prenom} {m.nom}</Text>
                <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>{m.telephone}</Text>
                <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Inscrit le {m.date_inscription?.slice(0, 10)}</Text>
              </View>
            ))}
          </>
        )}

        {tab === "coachs" && (
          <>
            <EliteButton title="Ajouter un coach" onPress={() => setShowCoach(true)} variant="primary" small />
            {coachs.map((c: any) => (
              <View key={c.id_coach} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{c.prenom} {c.nom}</Text>
                <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>{c.specialite}</Text>
                <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>{c.telephone}</Text>
              </View>
            ))}
          </>
        )}

        {tab === "paiements" && paiements.map((p: any) => (
          <View key={p.id_paiement} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.row}>
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
      </ScrollView>

      <Modal visible={showMembre || showCoach} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
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
            <EliteInput label="Téléphone" value={form.telephone} onChangeText={(v) => setForm({ ...form, telephone: v })} keyboardType="phone-pad" />
            {showCoach && (
              <EliteInput label="Spécialité" value={form.specialite} onChangeText={(v) => setForm({ ...form, specialite: v })} placeholder="ex: Musculation & Force" />
            )}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <EliteButton title="Annuler" onPress={() => { setShowMembre(false); setShowCoach(false); }} variant="outline" />
              </View>
              <View style={{ flex: 1 }}>
                <EliteButton title="Ajouter" onPress={showMembre ? handleAjouterMembre : handleAjouterCoach} loading={loading} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  statCard: { flex: 1, borderRadius: 10, padding: 12, alignItems: "center", borderWidth: 1 },
  statNum: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11 },
  tabBar: { borderBottomWidth: 1 },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabLabel: { fontSize: 12, fontWeight: "600" },
  content: { padding: 16, gap: 10 },
  card: { borderRadius: 12, padding: 14, gap: 4, borderWidth: 1 },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardSub: { fontSize: 13 },
  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  montant: { fontSize: 16, fontWeight: "800" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: "800" },
});
