import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Platform, Alert, Modal, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import EliteButton from "@/components/EliteButton";
import EliteInput from "@/components/EliteInput";
import { Feather } from "@expo/vector-icons";

type Tab = "cours" | "membres" | "progress" | "exercices";

const STATUT_STYLE: Record<string, { color: string; label: string }> = {
  en_attente: { color: "#f59e0b", label: "En attente" },
  publie: { color: "#10b981", label: "Approuvé ✓" },
  annule: { color: "#ef4444", label: "Refusé" },
  termine: { color: "#6b7280", label: "Terminé" },
};

export default function CoachDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("cours");
  const [cours, setCours] = useState<any[]>([]);
  const [membres, setMembres] = useState<any[]>([]);
  const [suivis, setSuivis] = useState<any[]>([]);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showExerciceModal, setShowExerciceModal] = useState(false);
  const [showSuiviModal, setShowSuiviModal] = useState(false);
  const [form, setForm] = useState({ type_cours: "", date_cours: "", heure_debut: "", duree_minutes: "60", salle: "", capacite_max: "20" });
  const [exerciceForm, setExerciceForm] = useState({ id_membre: "", titre: "", description: "" });
  const [suiviForm, setSuiviForm] = useState({ id_membre: "", poids_kg: "", imc: "", tour_taille: "", observations: "" });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user?.id_coach) return;
    try {
      const [c, m] = await Promise.all([
        api.get(`/cours/coach/${user.id_coach}`),
        api.get(`/coachs/${user.id_coach}/membres`),
      ]);
      setCours(c);
      setMembres(m);
    } catch {}
  };

  const loadProgress = async () => {
    if (!user?.id_coach) return;
    try {
      const [s, p] = await Promise.all([
        api.get(`/progress/coach/${user.id_coach}`),
        api.get(`/exercices/coach/${user.id_coach}`),
      ]);
      setSuivis(s);
      setProgrammes(p);
    } catch {}
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (tab === "progress" || tab === "exercices") loadProgress(); }, [tab]);
  const onRefresh = async () => { setRefreshing(true); await Promise.all([load(), loadProgress()]); setRefreshing(false); };

  const handleAjouterCours = async () => {
    if (!form.type_cours || !form.date_cours || !form.heure_debut || !form.salle) {
      Alert.alert("Erreur", "Remplissez tous les champs");
      return;
    }
    setLoading(true);
    try {
      await api.post("/cours", {
        ...form,
        id_coach: user?.id_coach,
        duree_minutes: parseInt(form.duree_minutes),
        capacite_max: parseInt(form.capacite_max),
      });
      Alert.alert("Soumis ✓", "Votre cours est soumis pour approbation par l'administrateur.");
      setShowModal(false);
      setForm({ type_cours: "", date_cours: "", heure_debut: "", duree_minutes: "60", salle: "", capacite_max: "20" });
      load();
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoading(false); }
  };

  const handleAjouterExercice = async () => {
    if (!exerciceForm.id_membre || !exerciceForm.titre) {
      Alert.alert("Erreur", "Sélectionnez un membre et ajoutez un titre");
      return;
    }
    setLoading(true);
    try {
      await api.post("/exercices", {
        id_coach: user?.id_coach,
        id_membre: parseInt(exerciceForm.id_membre),
        titre: exerciceForm.titre,
        description: exerciceForm.description,
      });
      Alert.alert("Succès", "Programme créé ✓");
      setShowExerciceModal(false);
      setExerciceForm({ id_membre: "", titre: "", description: "" });
      loadProgress();
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoading(false); }
  };

  const handleAjouterSuivi = async () => {
    if (!suiviForm.id_membre) {
      Alert.alert("Erreur", "Sélectionnez un membre");
      return;
    }
    setLoading(true);
    try {
      await api.post("/progress", {
        id_coach: user?.id_coach,
        id_membre: parseInt(suiviForm.id_membre),
        poids_kg: suiviForm.poids_kg ? parseFloat(suiviForm.poids_kg) : undefined,
        imc: suiviForm.imc ? parseFloat(suiviForm.imc) : undefined,
        tour_taille: suiviForm.tour_taille ? parseFloat(suiviForm.tour_taille) : undefined,
        observations: suiviForm.observations || undefined,
      });
      Alert.alert("Succès", "Mesure enregistrée ✓");
      setShowSuiviModal(false);
      setSuiviForm({ id_membre: "", poids_kg: "", imc: "", tour_taille: "", observations: "" });
      loadProgress();
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setLoading(false); }
  };

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: "cours", label: "Planning", icon: "calendar" },
    { key: "membres", label: "Membres", icon: "users" },
    { key: "progress", label: "Suivi", icon: "trending-up" },
    { key: "exercices", label: "Programmes", icon: "clipboard" },
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
            onPress={() => setTab(t.key)}
            style={[styles.tabBtn, tab === t.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          >
            <Feather name={t.icon as any} size={14} color={tab === t.key ? colors.primary : colors.mutedForeground} />
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
            <EliteButton title="Soumettre un cours" onPress={() => setShowModal(true)} variant="primary" />
            <View style={[styles.infoBox, { backgroundColor: "#f59e0b10", borderColor: "#f59e0b40" }]}>
              <Text style={[styles.infoText, { color: "#b45309" }]}>
                📋 Les cours soumis nécessitent l'approbation de l'admin avant d'être publiés.
              </Text>
            </View>
            {cours.length === 0 ? (
              <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 20 }}>Aucun cours planifié</Text>
            ) : (
              cours.map((c: any) => {
                const s = STATUT_STYLE[c.statut] || { color: "#6b7280", label: c.statut };
                return (
                  <View key={c.id_cours} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.coursNom, { color: colors.foreground }]}>{c.type_cours}</Text>
                        <Text style={[styles.coursInfo, { color: colors.mutedForeground }]}>
                          📅 {c.date_cours?.slice(0, 10)} • {c.heure_debut?.slice(0, 5)} • {c.duree_minutes} min
                        </Text>
                        <Text style={[styles.coursInfo, { color: colors.mutedForeground }]}>
                          🏠 {c.salle} • {c.places_restantes}/{c.capacite_max} places
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: s.color + "15" }]}>
                        <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {tab === "membres" && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Membres ayant réservé vos cours ({membres.length})
            </Text>
            {membres.length === 0 ? (
              <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 20 }}>Aucun membre encore</Text>
            ) : (
              membres.map((m: any) => (
                <View key={m.id_membre} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
                      <Text style={[styles.avatarText, { color: colors.primary }]}>{m.prenom?.[0]}{m.nom?.[0]}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.coursNom, { color: colors.foreground }]}>{m.prenom} {m.nom}</Text>
                      <Text style={[styles.coursInfo, { color: colors.mutedForeground }]}>
                        Membre #{m.id_membre} • {m.telephone || m.email}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {tab === "progress" && (
          <>
            <EliteButton title="+ Ajouter une mesure" onPress={() => setShowSuiviModal(true)} variant="primary" />
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 4 }]}>Historique des mesures</Text>
            {suivis.length === 0 ? (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>Aucune mesure enregistrée</Text>
              </View>
            ) : (
              suivis.map((s: any) => (
                <View key={s.id_suivi} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={[styles.coursNom, { color: colors.foreground }]}>{s.membre_nom}</Text>
                    <Text style={[styles.coursInfo, { color: colors.mutedForeground }]}>{s.date_mesure?.slice(0, 10)}</Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                    {s.poids_kg && <View style={[styles.pill, { backgroundColor: colors.primary + "15" }]}><Text style={[styles.pillText, { color: colors.primary }]}>{s.poids_kg} kg</Text></View>}
                    {s.imc && <View style={[styles.pill, { backgroundColor: "#10b98115" }]}><Text style={[styles.pillText, { color: "#10b981" }]}>IMC {s.imc}</Text></View>}
                    {s.tour_taille && <View style={[styles.pill, { backgroundColor: "#f59e0b15" }]}><Text style={[styles.pillText, { color: "#f59e0b" }]}>{s.tour_taille} cm</Text></View>}
                  </View>
                  {s.observations && <Text style={[styles.coursInfo, { color: colors.foreground }]}>📝 {s.observations}</Text>}
                </View>
              ))
            )}
          </>
        )}

        {tab === "exercices" && (
          <>
            <EliteButton title="+ Créer un programme" onPress={() => setShowExerciceModal(true)} variant="primary" />
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 4 }]}>Programmes créés</Text>
            {programmes.length === 0 ? (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>Aucun programme créé</Text>
              </View>
            ) : (
              programmes.map((p: any) => (
                <View key={p.id_programme} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.coursNom, { color: colors.foreground }]}>{p.titre}</Text>
                  <Text style={[styles.coursInfo, { color: colors.primary }]}>Pour : {p.membre_nom}</Text>
                  {p.description && <Text style={[styles.coursInfo, { color: colors.foreground }]}>{p.description}</Text>}
                  <Text style={[styles.coursInfo, { color: colors.mutedForeground }]}>Créé le {p.date_creation?.slice(0, 10)}</Text>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Modal: Nouveau cours */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Soumettre un cours</Text>
              <View style={[styles.infoBox, { backgroundColor: "#f59e0b10", borderColor: "#f59e0b40" }]}>
                <Text style={[styles.infoText, { color: "#b45309" }]}>⚠️ Le cours sera soumis pour approbation admin avant publication.</Text>
              </View>
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
                  <EliteButton title="Soumettre" onPress={handleAjouterCours} loading={loading} />
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal: Nouveau programme d'exercice */}
      <Modal visible={showExerciceModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Nouveau programme</Text>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Membre (ID)</Text>
            {membres.length > 0 ? (
              membres.map((m: any) => (
                <TouchableOpacity
                  key={m.id_membre}
                  onPress={() => setExerciceForm({ ...exerciceForm, id_membre: String(m.id_membre) })}
                  style={[styles.selectRow, { borderColor: exerciceForm.id_membre === String(m.id_membre) ? colors.primary : colors.border }]}
                >
                  <Text style={[styles.selectText, { color: exerciceForm.id_membre === String(m.id_membre) ? colors.primary : colors.foreground }]}>
                    {m.prenom} {m.nom}
                  </Text>
                  {exerciceForm.id_membre === String(m.id_membre) && (
                    <Feather name="check" size={14} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Aucun membre disponible</Text>
            )}
            <EliteInput label="Titre du programme" placeholder="ex: Programme Cardio 4 semaines" value={exerciceForm.titre} onChangeText={(v) => setExerciceForm({ ...exerciceForm, titre: v })} />
            <EliteInput label="Description / exercices" placeholder="Détails du programme..." value={exerciceForm.description} onChangeText={(v) => setExerciceForm({ ...exerciceForm, description: v })} multiline />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <EliteButton title="Annuler" onPress={() => setShowExerciceModal(false)} variant="outline" />
              </View>
              <View style={{ flex: 1 }}>
                <EliteButton title="Créer" onPress={handleAjouterExercice} loading={loading} />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Nouvelle mesure suivi */}
      <Modal visible={showSuiviModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Nouvelle mesure</Text>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Sélectionner le membre</Text>
              {membres.map((m: any) => (
                <TouchableOpacity
                  key={m.id_membre}
                  onPress={() => setSuiviForm({ ...suiviForm, id_membre: String(m.id_membre) })}
                  style={[styles.selectRow, { borderColor: suiviForm.id_membre === String(m.id_membre) ? colors.primary : colors.border }]}
                >
                  <Text style={[styles.selectText, { color: suiviForm.id_membre === String(m.id_membre) ? colors.primary : colors.foreground }]}>
                    {m.prenom} {m.nom}
                  </Text>
                  {suiviForm.id_membre === String(m.id_membre) && (
                    <Feather name="check" size={14} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <EliteInput label="Poids (kg)" value={suiviForm.poids_kg} onChangeText={(v) => setSuiviForm({ ...suiviForm, poids_kg: v })} keyboardType="numeric" placeholder="70.5" />
                </View>
                <View style={{ flex: 1 }}>
                  <EliteInput label="IMC" value={suiviForm.imc} onChangeText={(v) => setSuiviForm({ ...suiviForm, imc: v })} keyboardType="numeric" placeholder="22.4" />
                </View>
              </View>
              <EliteInput label="Tour de taille (cm)" value={suiviForm.tour_taille} onChangeText={(v) => setSuiviForm({ ...suiviForm, tour_taille: v })} keyboardType="numeric" placeholder="80" />
              <EliteInput label="Observations" value={suiviForm.observations} onChangeText={(v) => setSuiviForm({ ...suiviForm, observations: v })} placeholder="Progrès, remarques..." multiline />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <EliteButton title="Annuler" onPress={() => setShowSuiviModal(false)} variant="outline" />
                </View>
                <View style={{ flex: 1 }}>
                  <EliteButton title="Enregistrer" onPress={handleAjouterSuivi} loading={loading} />
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
  tabBar: { flexDirection: "row", borderBottomWidth: 1 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 12 },
  tabLabel: { fontSize: 11, fontWeight: "600" },
  content: { padding: 16, gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  card: { borderRadius: 12, padding: 14, gap: 6, borderWidth: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 14, fontWeight: "800" },
  coursNom: { fontSize: 15, fontWeight: "700" },
  coursInfo: { fontSize: 12, lineHeight: 18 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: "700" },
  pill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  pillText: { fontSize: 12, fontWeight: "700" },
  infoBox: { borderRadius: 8, padding: 10, borderWidth: 1 },
  infoText: { fontSize: 12, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: "600" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 12, maxHeight: "90%" },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  selectRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderRadius: 8, padding: 10 },
  selectText: { fontSize: 14, fontWeight: "600" },
});
