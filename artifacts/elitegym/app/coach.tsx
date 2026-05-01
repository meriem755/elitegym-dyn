import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Platform, Alert, Modal, TextInput, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import EliteButton from "@/components/EliteButton";
import EliteInput from "@/components/EliteInput";
import { Feather } from "@expo/vector-icons";

export default function CoachDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<"cours" | "membres" | "messages">("cours");
  const [cours, setCours] = useState<any[]>([]);
  const [membres, setMembres] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type_cours: "", date_cours: "", heure_debut: "", duree_minutes: "60", salle: "", capacite_max: "20" });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user?.id_coach) return;
    try {
      const [c, m, msg] = await Promise.all([
        api.get(`/cours/coach/${user.id_coach}`),
        api.get(`/coachs/${user.id_coach}/membres`),
        api.get(`/messages/${user.id}`),
      ]);
      setCours(c);
      setMembres(m);
      setMessages(msg);
    } catch {}
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleAjouterCours = async () => {
    if (!form.type_cours || !form.date_cours || !form.heure_debut || !form.salle) {
      Alert.alert("Erreur", "Remplissez tous les champs");
      return;
    }
    setLoading(true);
    try {
      await api.post("/cours", { ...form, id_coach: user?.id_coach, duree_minutes: parseInt(form.duree_minutes), capacite_max: parseInt(form.capacite_max) });
      Alert.alert("Succès", "Cours planifié !");
      setShowModal(false);
      load();
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoading(false); }
  };

  const TABS = [
    { key: "cours", label: "Mes cours", icon: "calendar" },
    { key: "membres", label: "Membres", icon: "users" },
    { key: "messages", label: "Messages", icon: "bell" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: Platform.OS === "web" ? 80 : insets.top }]}>
        <View>
          <Text style={styles.headerTitle}>Espace Coach</Text>
          <Text style={styles.headerSub}>{user?.prenom} {user?.nom}</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Feather name="log-out" size={22} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>

      <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setTab(t.key as any)}
            style={[styles.tabBtn, tab === t.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          >
            <Feather name={t.icon as any} size={16} color={tab === t.key ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.tabLabel, { color: tab === t.key ? colors.primary : colors.mutedForeground }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {tab === "cours" && (
          <>
            <EliteButton title="Planifier un cours" onPress={() => setShowModal(true)} variant="primary" />
            {cours.map((c: any) => (
              <View key={c.id_cours} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.coursNom, { color: colors.foreground }]}>{c.type_cours}</Text>
                <Text style={[styles.coursInfo, { color: colors.mutedForeground }]}>
                  {c.date_cours?.slice(0, 10)} • {c.heure_debut?.slice(0, 5)} • {c.salle}
                </Text>
                <Text style={[styles.coursInfo, { color: colors.mutedForeground }]}>
                  {c.places_restantes}/{c.capacite_max} places • {c.statut}
                </Text>
              </View>
            ))}
          </>
        )}

        {tab === "membres" && membres.map((m: any) => (
          <View key={m.id_membre} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.coursNom, { color: colors.foreground }]}>{m.prenom} {m.nom}</Text>
            <Text style={[styles.coursInfo, { color: colors.mutedForeground }]}>{m.telephone}</Text>
          </View>
        ))}

        {tab === "messages" && messages.map((msg: any) => (
          <View key={msg.id_notification} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.coursInfo, { color: colors.foreground }]}>{msg.contenu}</Text>
            <Text style={[styles.coursInfo, { color: colors.mutedForeground }]}>
              {new Date(msg.date_envoi).toLocaleDateString("fr-FR")}
            </Text>
          </View>
        ))}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Nouveau cours</Text>
            <EliteInput label="Type de cours" placeholder="ex: Body Pump" value={form.type_cours} onChangeText={(v) => setForm({ ...form, type_cours: v })} />
            <EliteInput label="Date (YYYY-MM-DD)" placeholder="2026-05-10" value={form.date_cours} onChangeText={(v) => setForm({ ...form, date_cours: v })} />
            <EliteInput label="Heure début (HH:MM)" placeholder="09:00" value={form.heure_debut} onChangeText={(v) => setForm({ ...form, heure_debut: v })} />
            <EliteInput label="Salle" placeholder="Salle A" value={form.salle} onChangeText={(v) => setForm({ ...form, salle: v })} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <EliteInput label="Durée (min)" value={form.duree_minutes} onChangeText={(v) => setForm({ ...form, duree_minutes: v })} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <EliteInput label="Capacité max" value={form.capacite_max} onChangeText={(v) => setForm({ ...form, capacite_max: v })} keyboardType="numeric" />
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <EliteButton title="Annuler" onPress={() => setShowModal(false)} variant="outline" />
              </View>
              <View style={{ flex: 1 }}>
                <EliteButton title="Créer" onPress={handleAjouterCours} loading={loading} />
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
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  tabLabel: { fontSize: 12, fontWeight: "600" },
  content: { padding: 16, gap: 10 },
  card: { borderRadius: 12, padding: 14, gap: 4, borderWidth: 1 },
  coursNom: { fontSize: 15, fontWeight: "700" },
  coursInfo: { fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: "800" },
});
